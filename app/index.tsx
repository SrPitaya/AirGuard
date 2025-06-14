import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Bienvenido. ¿Qué deseas hacer?</Text>
      <Button title="Iniciar sesión" onPress={() => router.push("/login")} />
      <Button title="Registrarse" onPress={() => router.push("/register")} />
    </View>
  );
}
