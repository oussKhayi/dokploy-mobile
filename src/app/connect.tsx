import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConnectForm } from "../components/ConnectForm";
import { colors, space } from "../theme";

export default function Connect() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: space(6), flexGrow: 1, justifyContent: "center" }}
        >
          <View style={{ alignItems: "center", gap: space(2), marginBottom: space(8) }}>
            <Image source={require("../../assets/logo.png")} style={{ width: 88, height: 88 }} resizeMode="contain" />
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "700", marginTop: space(3) }}>
              Connect to Dokploy
            </Text>
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: "center" }}>
              Use your instance URL and an API key from Profile, API/CLI.
            </Text>
          </View>
          <ConnectForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
