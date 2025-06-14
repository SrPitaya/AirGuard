import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
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
    return <Text>Cargando...</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Ubicación: {ubicacion.nombre}</Text>
      
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Crear AirGuard</Text>
      <TextInput
        placeholder="Nombre"
        value={agNombre}
        onChangeText={setAgNombre}
        style={{ borderWidth: 1, marginBottom: 5, padding: 8 }}
      />
      <TextInput
        placeholder="Posición"
        value={agPosicion}
        onChangeText={setAgPosicion}
        style={{ borderWidth: 1, marginBottom: 5, padding: 8 }}
      />
      <TextInput
        placeholder="ChannelID"
        value={agChanelid}
        onChangeText={setAgChanelid}
        style={{ borderWidth: 1, marginBottom: 5, padding: 8 }}
      />
      <TextInput
        placeholder="Read API Key"
        value={agReadApiKey}
        onChangeText={setAgReadApiKey}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button title="Crear AirGuard" onPress={handleCrearAirGuard} />
      
      <Text style={{ fontSize: 18, marginTop: 20, marginBottom: 10 }}>AirGuards:</Text>
      <FlatList
        data={airguards}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 10, padding: 10, borderWidth: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Nombre: {item.nombre}</Text>
            <Text>Posición: {item.posicion}</Text>
            <Text>ChannelID: {item.chanelid}</Text>
            <Text>API Key: {item.readApiKey}</Text>
            <Button
              title="Eliminar AirGuard"
              onPress={() => handleEliminarAirGuard(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}