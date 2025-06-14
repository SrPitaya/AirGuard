import { Stack } from "expo-router";

export default function PanelAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#23242b" },
        headerTintColor: "#fff",
        headerTitleStyle: { color: "#fff" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Panel Admin" }} />
      <Stack.Screen name="grupo/[id]" options={{ title: "Gestión de Grupo" }} />
      <Stack.Screen 
        name="[grupoId]/ubicacion/[ubicacionId]" 
        options={{ title: "Gestión de AirGuards" }} 
      />
    </Stack>
  );
}