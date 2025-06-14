import { useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, Text, TextInput, View } from "react-native";
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
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Cerrar sesión" onPress={handleLogout} />
      
      <Text style={{ fontSize: 18, marginTop: 20 }}>Crear Grupo</Text>
      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        placeholder="Clave de acceso"
        value={clave}
        onChangeText={setClave}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button title="Crear Grupo" onPress={handleCrearGrupo} />
      
      <Text style={{ fontSize: 18, marginTop: 20 }}>Grupos existentes:</Text>
      <FlatList
        data={grupos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5, padding: 10, borderWidth: 1 }}>
            <Text style={{ flex: 1, fontSize: 16 }}>{item.nombre}</Text>
            <Button 
              title="Gestionar" 
              onPress={() => router.push(`../paneldeadmin/grupo/${item.id}`)} 
            />
            <View style={{ width: 10 }} />
            <Button 
              title="Eliminar" 
              onPress={() => handleEliminarGrupo(item.id)} 
            />
          </View>
        )}
      />
    </View>
  );
}