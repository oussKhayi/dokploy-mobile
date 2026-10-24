import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { colors, space } from "../theme";
import { Button, Field, Icon } from "./ui";

export function ConnectForm({ onDone, submitLabel = "Connect" }: { onDone?: () => void; submitLabel?: string }) {
  const { addAccount } = useAuth();
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await addAccount(url, apiKey, name);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: space(5) }}>
      <Field
        label="Instance URL"
        placeholder="https://dokploy.example.com"
        value={url}
        onChangeText={setUrl}
        keyboardType="url"
        hint="HTTP and IP:port addresses work too."
      />
      <Field label="API key" placeholder="Paste your API key" value={apiKey} onChangeText={setApiKey} secureTextEntry />
      <Field
        label="Account name (optional)"
        placeholder="e.g. Production, Client X"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      {error ? (
        <View style={{ flexDirection: "row", gap: space(2), alignItems: "center" }}>
          <Icon name="alert-circle-outline" color={colors.danger} />
          <Text style={{ color: colors.danger, flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={loading} disabled={!url || !apiKey} />

      <Text style={{ color: colors.faint, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
        Keys are stored encrypted on this device and only sent to their own instance.{"\n"}
        <Text
          style={{ color: colors.muted, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL("https://docs.dokploy.com/docs/api")}
        >
          How to get an API key
        </Text>
      </Text>
    </View>
  );
}
