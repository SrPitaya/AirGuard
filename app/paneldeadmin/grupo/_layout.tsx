import { Stack } from "expo-router";

export default function GrupoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#23242b" },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Gestión de Ubicaciones" }} />
      <Stack.Screen name="[grupoId]/ubicacion/[ubicacionId]" options={{ title: "Gestión de AirGuards" }} />
    </Stack>
  );
}