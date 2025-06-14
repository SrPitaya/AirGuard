import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
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
    return <Text>Cargando...</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Grupo: {grupo.nombre}</Text>
      
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Crear Ubicación</Text>
      <TextInput
        placeholder="Nombre de ubicación"
        value={ubicNombre}
        onChangeText={setUbicNombre}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button title="Crear Ubicación" onPress={handleCrearUbicacion} />
      
      <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>Ubicaciones:</Text>
      <FlatList
        data={ubicaciones}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 5, padding: 10, borderWidth: 1 }}>
            <Text style={{ flex: 1, fontSize: 16 }}>{item.nombre}</Text>
            <Button 
              title="AirGuards" 
              onPress={() => router.push(`../grupo/${id}/ubicacion/${item.id}`)} 
            />
            <View style={{ width: 10 }} />
            <Button 
              title="Eliminar" 
              onPress={() => handleEliminarUbicacion(item.id)} 
            />
          </View>
        )}
      />
    </View>
  );
}