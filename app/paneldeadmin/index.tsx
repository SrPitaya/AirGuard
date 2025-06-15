import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View, StyleSheet, FlatList } from "react-native";
import { auth, db } from "../../firebase";

export default function PanelDeAdmin() {
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [grupos, setGrupos] = useState<any[]>([]);
  const router = useRouter();

  const fetchGrupos = async () => {
    const snapshot = await getDocs(collection(db, "grupos"));
    setGrupos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    // Protección de ruta: solo admin
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }
      const userDoc = await getDocs(query(collection(db, "usuarios"), where("email", "==", user.email)));
      const rol = userDoc.docs[0]?.data()?.rol;
      if (rol !== "admin") {
        Alert.alert("Acceso denegado", "Solo administradores pueden acceder.");
        router.replace("/dashboardusuario");
      }
    };
    checkAdmin();
    fetchGrupos();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  const handleCrearGrupo = async () => {
    if (!nombre || !clave) return;
    // Validar grupo único
    const q = query(collection(db, "grupos"), where("nombre", "==", nombre));
    const exists = (await getDocs(q)).size > 0;
    if (exists) {
      Alert.alert("El grupo ya existe");
      return;
    }
    await addDoc(collection(db, "grupos"), { nombre, clave });
    setNombre("");
    setClave("");
    fetchGrupos();
  };

  const handleEliminarGrupo = async (id: string) => {
    await deleteDoc(doc(db, "grupos", id));
    fetchGrupos();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="Cerrar sesión" onPress={handleLogout} color="#888" />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Crear Grupo</Text>
        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#888"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <TextInput
          placeholder="Clave de acceso"
          placeholderTextColor="#888"
          value={clave}
          onChangeText={setClave}
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button title="Crear Grupo" onPress={handleCrearGrupo} color="#4CAF50" />
        </View>
      </View>

      <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 10 }]}>Grupos existentes:</Text>
      {grupos.length === 0 ? (
        <Text style={{ color: "#bbb", textAlign: "center" }}>No hay grupos registrados.</Text>
      ) : (
        <FlatList
          data={grupos}
          keyExtractor={item => item.id}
          contentContainerStyle={{ alignItems: "center" }}
          renderItem={({ item }) => (
            <View style={styles.groupCard}>
              <Text style={styles.groupName}>{item.nombre}</Text>
              <View style={styles.groupButtons}>
                <Button
                  title="Gestionar"
                  onPress={() => router.push(`../paneldeadmin/grupo/${item.id}`)}
                  color="#2196F3"
                />
                <View style={{ width: 10 }} />
                <Button
                  title="Eliminar"
                  onPress={() => handleEliminarGrupo(item.id)}
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
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
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
  groupCard: {
    backgroundColor: "#23242b",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    width: 340,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
    alignItems: "center",
  },
  groupName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  groupButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});