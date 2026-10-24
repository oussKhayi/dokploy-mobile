import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { ConnectForm } from "../../components/ConnectForm";
import { space } from "../../theme";

export default function AddAccount() {
  const router = useRouter();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space(4) }}>
        <ConnectForm submitLabel="Add account" onDone={() => router.canGoBack() && router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
