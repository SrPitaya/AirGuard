import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
import { StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>¿Qué deseas hacer?</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Iniciar sesión"
            onPress={() => router.push("/login")}
            color="#4CAF50"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Registrarse"
            onPress={() => router.push("/register")}
            color="#2196F3"
          />
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    width: 200,
    alignSelf: "center",
    marginVertical: 8,
  },
});
