import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth, db } from "../firebase"; // Asegúrate de que la ruta sea correcta

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (auth.currentUser) {
      // Redirigir según rol
      (async () => {
        const userDoc = await getDoc(doc(db, "usuarios", auth.currentUser!.uid));
        const rol = userDoc.exists() ? userDoc.data().rol : "usuario";
        if (rol === "admin") {
          router.replace("/paneldeadmin");
        } else {
          router.replace("/dashboardusuario");
        }
      })();
    }
  }, []);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Obtener rol del usuario
      const userDoc = await getDoc(doc(db, "usuarios", userCredential.user.uid));
      const rol = userDoc.exists() ? userDoc.data().rol : "usuario";
      if (rol === "admin") {
        router.replace("/paneldeadmin");
      } else {
        router.replace("/dashboardusuario");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, width: 200, marginBottom: 10 }}
      />
      <Text>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, width: 200, marginBottom: 10 }}
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
    </View>
  );
}
