import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="cv"
        options={{
          title: 'Mi Perfil',
        }}
      />
      <Tabs.Screen
        name="postulaciones"
        options={{
          title: 'Postulaciones',
        }}
      />
      <Tabs.Screen
        name="voz"
        options={{
          title: 'Asistente Voz',
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Ocultar de la barra de tabs
        }}
      />
    </Tabs>
  );
}
