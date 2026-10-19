import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field, Icon } from "../components/ui";
import { useAuth } from "../lib/auth";
import { colors, space } from "../theme";

export default function Connect() {
  const { connect } = useAuth();
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await connect(url, apiKey);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: space(6), gap: space(5), flexGrow: 1, justifyContent: "center" }}>
          <View style={{ gap: space(2), marginBottom: space(4) }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: colors.surface2,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space(3),
              }}
            >
              <Icon name="cloud-outline" size={26} />
            </View>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>Connect to Dokploy</Text>
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 21 }}>
              Use your instance URL and an API key from Dokploy, under Profile, API/CLI.
            </Text>
          </View>

          <Field
            label="Instance URL"
            placeholder="https://dokploy.example.com"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            hint="HTTP and IP:port addresses work too."
          />
          <Field
            label="API key"
            placeholder="Paste your API key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />

          {error ? (
            <View style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
              <Icon name="alert-circle-outline" color={colors.danger} />
              <Text style={{ color: colors.danger, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Button title="Connect" onPress={submit} loading={loading} disabled={!url || !apiKey} />

          <Text style={{ color: colors.faint, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            Your key is stored encrypted on this device and only sent to your instance.{"\n"}
            <Text
              style={{ color: colors.muted, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL("https://docs.dokploy.com/docs/api")}
            >
              How to get an API key
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
