import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import { auth, db } from "../firebase";

// Configuración de refresco (ajustable)
const THINGSPEAK_REFRESH_RATE = 5000; // 5 segundos (puedes reducirlo a 2000 si es necesario)
const FIREBASE_REFRESH_RATE = 30000; // 30 segundos

async function fetchThingSpeakData(channelId: string, apiKey: string, lastData: any) {
  try {
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=1`;
    const res = await fetch(url);
    const data = await res.json();
    const feed = data.feeds && data.feeds[0];
    
    // Mantenemos los datos anteriores si no hay nuevos
    return {
      temperatura: feed?.field1 || lastData?.temperatura || "N/A",
      humedad: feed?.field2 || lastData?.humedad || "N/A",
      polvo: feed?.field3 || lastData?.polvo || "N/A",
      lastUpdated: new Date().toLocaleTimeString(),
      status: feed ? "live" : "cached"
    };
  } catch (error) {
    // Si hay error, mantenemos los últimos datos válidos
    return {
      ...lastData,
      status: "error",
      lastUpdated: new Date().toLocaleTimeString()
    };
  }
}

export default function DashboardUsuario() {
  const [grupoNombre, setGrupoNombre] = useState("");
  const [clave, setClave] = useState("");
  const [miGrupo, setMiGrupo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [airguards, setAirguards] = useState<{ [ubicacionId: string]: any[] }>({});
  const [thingData, setThingData] = useState<{ [airguardId: string]: any }>({});

  const user = auth.currentUser;
  const router = useRouter();
  const thingSpeakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestsRef = useRef<AbortController[]>([]);

  // Protección de ruta
  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user]);

  // Cargar datos estructurales (menos frecuente)
  const loadStructureData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      const grupoId = userDoc.exists() ? userDoc.data().grupoId : null;

      if (!grupoId) {
        setMiGrupo(null);
        setUbicaciones([]);
        setAirguards({});
        return;
      }

      const [grupoDoc, ubicacionesSnap] = await Promise.all([
        getDoc(doc(db, "grupos", grupoId)),
        getDocs(query(collection(db, "ubicaciones"), where("grupoId", "==", grupoId)))
      ]);

      if (!grupoDoc.exists()) return;

      setMiGrupo({ id: grupoDoc.id, ...grupoDoc.data() });

      const ubicacionesArr = ubicacionesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUbicaciones(ubicacionesArr);

      // Obtener todos los AirGuards en paralelo
      const airguardsPromises = ubicacionesArr.map(ubic =>
        getDocs(query(collection(db, "airguards"), where("ubicacionId", "==", ubic.id)))
      );

      const airguardsResults = await Promise.all(airguardsPromises);
      const newAirguards: { [key: string]: any[] } = {};

      airguardsResults.forEach((agSnap, index) => {
        newAirguards[ubicacionesArr[index].id] = agSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
      });

      setAirguards(newAirguards);
    } catch (error) {
      console.error("Error loading structure:", error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar datos de ThingSpeak (muy frecuente)
  const refreshThingSpeakData = async () => {
    if (!ubicaciones.length || !Object.keys(airguards).length) return;

    let controller: AbortController | null = null;
    try {
      controller = new AbortController();
      activeRequestsRef.current.push(controller);

      const allPromises = ubicaciones.flatMap(ubic => 
        (airguards[ubic.id] || []).map(async ag => {
          const currentData = thingData[ag.id] || {};
          const newData = await fetchThingSpeakData(
            ag.chanelid, 
            ag.readApiKey, 
            currentData
          );

          return { agId: ag.id, data: newData };
        })
      );

      const results = await Promise.all(allPromises);
      const newThingData = { ...thingData };

      results.forEach(({ agId, data }) => {
        newThingData[agId] = data;
      });

      setThingData(newThingData);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Error refreshing ThingSpeak:", error);
      }
    } finally {
      if (controller) {
        activeRequestsRef.current = activeRequestsRef.current.filter(c => c !== controller);
      }
    }
  };

  // Efectos para manejar los intervalos
  useEffect(() => {
    // Carga inicial
    loadStructureData();

    // Intervalo para datos estructurales
    const firebaseInterval = setInterval(loadStructureData, FIREBASE_REFRESH_RATE);

    return () => {
      clearInterval(firebaseInterval);
      if (thingSpeakIntervalRef.current) clearInterval(thingSpeakIntervalRef.current);
      // Cancelar todas las peticiones pendientes al desmontar
      activeRequestsRef.current.forEach(controller => controller.abort());
    };
  }, [user]);

  useEffect(() => {
    // Iniciar intervalo de ThingSpeak cuando hay datos
    if (ubicaciones.length > 0 && Object.keys(airguards).length > 0) {
      // Ejecutar inmediatamente el primer refresh
      refreshThingSpeakData();

      // Configurar intervalo rápido para ThingSpeak
      thingSpeakIntervalRef.current = setInterval(refreshThingSpeakData, THINGSPEAK_REFRESH_RATE);
    }

    return () => {
      if (thingSpeakIntervalRef.current) {
        clearInterval(thingSpeakIntervalRef.current);
        thingSpeakIntervalRef.current = null;
      }
    };
  }, [ubicaciones, airguards]);

  // Handlers agregados (colócalos al inicio del componente o donde declares funciones)
  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  const handleUnirse = async () => {
    if (!grupoNombre || !clave) return;
    if (!user) {
      Alert.alert("Error", "Usuario no autenticado");
      return;
    }
    // Buscar grupo por nombre
    const q = query(collection(db, "grupos"), where("nombre", "==", grupoNombre));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      Alert.alert("Grupo no encontrado");
      return;
    }
    const grupoDoc = querySnapshot.docs[0];
    // Verificar clave (hash simple para ejemplo)
    if (grupoDoc.data().clave !== clave) {
      Alert.alert("Clave incorrecta");
      return;
    }
    // Actualizar usuario con grupoId
    await updateDoc(doc(db, "usuarios", user.uid), { grupoId: grupoDoc.id });
    setMiGrupo({ id: grupoDoc.id, ...grupoDoc.data() });
    Alert.alert("Te has unido al grupo");
  };

  const handleSalirGrupo = async () => {
    if (!user) {
      Alert.alert("Error", "Usuario no autenticado");
      return;
    }
    await updateDoc(doc(db, "usuarios", user.uid), { grupoId: null });
    setMiGrupo(null);
    setUbicaciones([]);
    setAirguards({});
    setThingData({});
    Alert.alert("Saliste del grupo");
  };

  // Funciones para obtener el color según el valor
  function getTempColor(tempStr: string) {
    const temp = parseFloat(tempStr);
    if (isNaN(temp)) return "#666";
    if (temp < 5) return "#0008FF";
    if (temp < 10) return "#0091FF";
    if (temp < 22) return "#00EEFF";
    if (temp < 30) return "#00FF15";
    if (temp < 35) return "#FFFF00";
    if (temp < 40) return "#FFA500";
    return "#FF0000";
  }
  function getHumColor(humStr: string) {
    const hum = parseFloat(humStr);
    if (isNaN(hum)) return "#666";
    if (hum >= 30 && hum < 60) return "#00FF15";
    if (hum < 90) return "#00FFEE";
    return "#0008FF";
  }
  function getPolvoColor(polvoStr: string) {
    const polvo = parseFloat(polvoStr);
    if (isNaN(polvo)) return "#666";
    if (polvo < 0.05) return "#00FF15";
    if (polvo < 0.10) return "#FFFF00";
    if (polvo < 0.15) return "orange";
    return "red";
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#181A20" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ color: "#fff" }}>Cargando estructura de datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={{ 
        flexGrow: 1, 
        padding: 16,
        paddingBottom: 40,
        backgroundColor: "#181A20"
      }}
    >
      {!miGrupo ? (
        <View style={{ width: "100%", maxWidth: 400, alignSelf: "center", backgroundColor: "#23242b", borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 20, marginBottom: 24, textAlign: "center", color: "#fff" }}>
            Unirse a un grupo
          </Text>
          
          <TextInput
            placeholder="Nombre del grupo"
            placeholderTextColor="#888"
            value={grupoNombre}
            onChangeText={setGrupoNombre}
            style={styles.input}
          />
          
          <TextInput
            placeholder="Clave de acceso"
            placeholderTextColor="#888"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            style={styles.input}
          />
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Unirse al grupo" 
              onPress={handleUnirse} 
              disabled={!grupoNombre || !clave}
              color="#4CAF50"
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>Grupo: {miGrupo.nombre}</Text>
          </View>

          <View style={{ marginTop: 24 }}>
            {ubicaciones.map(ubic => (
              <View key={ubic.id} style={styles.locationCard}>
                <Text style={styles.locationTitle}>{ubic.nombre}</Text>
                
                <View style={{ marginTop: 12 }}>
                  {(airguards[ubic.id] || []).map(ag => {
                    const data = thingData[ag.id] || {};
                    const isLive = data.status === "live";
                    const isError = data.status === "error";
                    
                    return (
                      <View 
                        key={ag.id} 
                        style={[
                          styles.sensorCard,
                          isError && styles.sensorCardError,
                          isLive && styles.sensorCardLive
                        ]}
                      >
                        <View style={styles.sensorHeader}>
                          <Text style={styles.sensorName}>{ag.nombre}</Text>
                          <Text style={styles.sensorPosition}>{ag.posicion}</Text>
                        </View>
                        
                        <View style={styles.sensorDataRow}>
                          <Text style={styles.sensorDataLabel}>Temperatura:</Text>
                          <Text 
                            style={[
                              styles.sensorDataValue,
                              { color: getTempColor(data.temperatura) }
                            ]}
                          >
                            {data.temperatura || "N/A"} °C
                          </Text>
                        </View>
                        
                        <View style={styles.sensorDataRow}>
                          <Text style={styles.sensorDataLabel}>Humedad:</Text>
                          <Text 
                            style={[
                              styles.sensorDataValue,
                              { color: getHumColor(data.humedad) }
                            ]}
                          >
                            {data.humedad || "N/A"} %
                          </Text>
                        </View>
                        
                        <View style={styles.sensorDataRow}>
                          <Text style={styles.sensorDataLabel}>Polvo:</Text>
                          <Text 
                            style={[
                              styles.sensorDataValue,
                              { color: getPolvoColor(data.polvo) }
                            ]}
                          >
                            {data.polvo || "N/A"} µg/m³
                          </Text>
                        </View>
                        
                        <Text 
                          style={[
                            styles.sensorStatus,
                            isError && styles.sensorStatusError,
                            isLive && styles.sensorStatusLive
                          ]}
                        >
                          {isLive ? "Datos en vivo" : isError ? "Error de conexión" : "Cargando..."} 
                          • Actualizado: {data.lastUpdated || "N/A"}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Botón "Salir del grupo" al final */}
          <View style={styles.buttonContainer}>
            <Button 
              title="Salir del grupo" 
              onPress={handleSalirGrupo} 
              color="#F44336"
            />
          </View>
        </>
      )}

      {/* Botón "Cerrar sesión" siempre al final */}
      <View style={styles.buttonContainer}>
        <Button title="Cerrar sesión" onPress={handleLogout} color="#888" />
      </View>
    </ScrollView>
  );
}

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#23242b",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  groupHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
    backgroundColor: "#23242b",
    borderRadius: 8,
    padding: 12
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#fff"
  },
  locationCard: {
    backgroundColor: "#23242b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333"
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 8,
    color: "#fff"
  },
  sensorCard: {
    backgroundColor: "#181A20",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#444"
  },
  sensorCardLive: {
    borderLeftColor: "#4CAF50"
  },
  sensorCardError: {
    borderLeftColor: "#F44336"
  },
  sensorHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8
  },
  sensorName: {
    fontWeight: "bold" as const,
    fontSize: 16,
    color: "#fff"
  },
  sensorPosition: {
    color: "#bbb",
    fontSize: 14
  },
  sensorDataRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginVertical: 4
  },
  sensorDataLabel: {
    color: "#bbb"
  },
  sensorDataValue: {
    fontWeight: "bold" as const
    // color dinámico según valor
  },
  sensorStatus: {
    marginTop: 8,
    fontSize: 12,
    color: "#bbb",
    textAlign: "right" as const
  },
  sensorStatusLive: {
    color: "#4CAF50"
  },
  sensorStatusError: {
    color: "#F44336"
  },
  buttonContainer: {
    width: 200,
    alignSelf: "center",
    marginVertical: 8
  }
});

