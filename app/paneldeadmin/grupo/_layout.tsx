import { Stack } from "expo-router";

export default function GrupoLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: "Gestión de Ubicaciones" }} />
      <Stack.Screen name="[grupoId]/ubicacion/[ubicacionId]" options={{ title: "Gestión de AirGuards" }} />
    </Stack>
  );
}