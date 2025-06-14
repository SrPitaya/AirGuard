import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Inicio" }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Registro" }} />
      <Stack.Screen name="dashboardusuario" options={{ title: "Dashboard Usuario" }} />
      <Stack.Screen name="paneldeadmin" options={{ headerShown: false }} />
    </Stack>
  );
}
