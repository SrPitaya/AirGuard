import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View, StyleSheet } from "react-native";
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="Email"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Contraseña"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <View style={styles.buttonContainer}>
          <Button title="Iniciar sesión" onPress={handleLogin} color="#4CAF50" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181A20",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#23242b",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#181A20",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    width: "100%",
  },
  buttonContainer: {
    width: 200,
    alignSelf: "center",
    marginVertical: 8,
  },
});
