import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button, Text, TextInput, View, StyleSheet, ScrollView } from "react-native";
import { db } from "../../../../../firebase";

export default function GestionAirGuards() {
  const { grupoId, ubicacionId } = useLocalSearchParams();
  const [ubicacion, setUbicacion] = useState<any>(null);
  const [airguards, setAirguards] = useState<any[]>([]);
  const [agNombre, setAgNombre] = useState("");
  const [agPosicion, setAgPosicion] = useState("");
  const [agChanelid, setAgChanelid] = useState("");
  const [agReadApiKey, setAgReadApiKey] = useState("");
  const router = useRouter();

  const fetchUbicacion = async () => {
    const ubicacionesSnapshot = await getDocs(collection(db, "ubicaciones"));
    const ubicacionData = ubicacionesSnapshot.docs.find(doc => doc.id === ubicacionId);
    if (ubicacionData) {
      setUbicacion({ id: ubicacionData.id, ...ubicacionData.data() });
    }
  };

  const fetchAirGuards = async () => {
    const snap = await getDocs(query(collection(db, "airguards"), where("ubicacionId", "==", ubicacionId)));
    setAirguards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchUbicacion();
    fetchAirGuards();
  }, [ubicacionId]);

  const handleCrearAirGuard = async () => {
    if (!agNombre || !agPosicion || !agChanelid || !agReadApiKey) return;
    await addDoc(collection(db, "airguards"), {
      ubicacionId,
      nombre: agNombre,
      posicion: agPosicion,
      chanelid: agChanelid,
      readApiKey: agReadApiKey,
    });
    setAgNombre("");
    setAgPosicion("");
    setAgChanelid("");
    setAgReadApiKey("");
    fetchAirGuards();
  };

  const handleEliminarAirGuard = async (agId: string) => {
    await deleteDoc(doc(db, "airguards", agId));
    fetchAirGuards();
  };

  if (!ubicacion) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Ubicación: {ubicacion.nombre}</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Crear AirGuard</Text>
        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#888"
          value={agNombre}
          onChangeText={setAgNombre}
          style={styles.input}
        />
        <TextInput
          placeholder="Posición"
          placeholderTextColor="#888"
          value={agPosicion}
          onChangeText={setAgPosicion}
          style={styles.input}
        />
        <TextInput
          placeholder="ChannelID"
          placeholderTextColor="#888"
          value={agChanelid}
          onChangeText={setAgChanelid}
          style={styles.input}
        />
        <TextInput
          placeholder="Read API Key"
          placeholderTextColor="#888"
          value={agReadApiKey}
          onChangeText={setAgReadApiKey}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button title="Crear AirGuard" onPress={handleCrearAirGuard} color="#4CAF50" />
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 10 }]}>AirGuards:</Text>
      {airguards.length === 0 ? (
        <Text style={{ color: "#bbb", textAlign: "center" }}>No hay AirGuards registrados.</Text>
      ) : (
        airguards.map(item => (
          <View key={item.id} style={styles.sensorCard}>
            <Text style={styles.sensorName}>Nombre: {item.nombre}</Text>
            <Text style={styles.sensorDetail}>Posición: {item.posicion}</Text>
            <Text style={styles.sensorDetail}>ChannelID: {item.chanelid}</Text>
            <Text style={styles.sensorDetail}>API Key: {item.readApiKey}</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Eliminar AirGuard"
                onPress={() => handleEliminarAirGuard(item.id)}
                color="#F44336"
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Estilos inspirados en dashboardusuario.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181A20",
    padding: 16,
    alignItems: "center",
  },
  scrollContainer: {
    backgroundColor: "#181A20",
    padding: 16,
    alignItems: "center",
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#23242b",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#181A20",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    width: "100%",
  },
  buttonContainer: {
    width: 200,
    alignSelf: "center",
    marginVertical: 8,
  },
  sensorCard: {
    backgroundColor: "#23242b",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    width: 340,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sensorName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 4,
  },
  sensorDetail: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 2,
  },
});
