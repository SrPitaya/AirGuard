import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button, Text, TextInput, View, StyleSheet, FlatList } from "react-native";
import { db } from "../../../firebase";

export default function GestionGrupo() {
  const { id } = useLocalSearchParams();
  const [grupo, setGrupo] = useState<any>(null);
  const [ubicNombre, setUbicNombre] = useState("");
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const router = useRouter();

  const fetchGrupo = async () => {
    const gruposSnapshot = await getDocs(collection(db, "grupos"));
    const grupoData = gruposSnapshot.docs.find(doc => doc.id === id);
    if (grupoData) {
      setGrupo({ id: grupoData.id, ...grupoData.data() });
    }
  };

  const fetchUbicaciones = async () => {
    const snap = await getDocs(query(collection(db, "ubicaciones"), where("grupoId", "==", id)));
    setUbicaciones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchGrupo();
    fetchUbicaciones();
  }, [id]);

  const handleCrearUbicacion = async () => {
    if (!ubicNombre) return;
    await addDoc(collection(db, "ubicaciones"), {
      grupoId: id,
      nombre: ubicNombre,
    });
    setUbicNombre("");
    fetchUbicaciones();
  };

  const handleEliminarUbicacion = async (ubicacionId: string) => {
    await deleteDoc(doc(db, "ubicaciones", ubicacionId));
    fetchUbicaciones();
  };

  if (!grupo) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#fff" }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grupo: {grupo.nombre}</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Crear Ubicación</Text>
        <TextInput
          placeholder="Nombre de ubicación"
          placeholderTextColor="#888"
          value={ubicNombre}
          onChangeText={setUbicNombre}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button title="Crear Ubicación" onPress={handleCrearUbicacion} color="#4CAF50" />
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 10 }]}>Ubicaciones:</Text>
      {ubicaciones.length === 0 ? (
        <Text style={{ color: "#bbb", textAlign: "center" }}>No hay ubicaciones registradas.</Text>
      ) : (
        <FlatList
          data={ubicaciones}
          keyExtractor={item => item.id}
          contentContainerStyle={{ alignItems: "center" }}
          renderItem={({ item }) => (
            <View style={styles.ubicCard}>
              <Text style={styles.ubicName}>{item.nombre}</Text>
              <View style={styles.ubicButtons}>
                <Button
                  title="AirGuards"
                  onPress={() => router.push(`../grupo/${id}/ubicacion/${item.id}`)}
                  color="#2196F3"
                />
                <View style={{ width: 10 }} />
                <Button
                  title="Eliminar"
                  onPress={() => handleEliminarUbicacion(item.id)}
                  color="#F44336"
                />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181A20",
    padding: 16,
    alignItems: "center",
    justifyContent: "flex-start",
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
  ubicCard: {
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
    alignItems: "center",
  },
  ubicName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  ubicButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});