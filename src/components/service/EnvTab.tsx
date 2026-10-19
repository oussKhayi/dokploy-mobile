import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { useAction } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import { SERVICE_CONFIG } from "../../lib/services";
import type { ServiceDetail, ServiceType } from "../../lib/types";
import { colors, mono, space } from "../../theme";
import { Button, Card, Field, ToggleRow } from "../ui";

type Props = { type: ServiceType; id: string; service: ServiceDetail };

export function EnvTab({ type, id, service }: Props) {
  const cfg = SERVICE_CONFIG[type];
  const [env, setEnv] = useState(service.env ?? "");
  const [buildArgs, setBuildArgs] = useState(service.buildArgs ?? "");
  const [createEnvFile, setCreateEnvFile] = useState(service.createEnvFile ?? true);
  const save = useAction({ invalidate: [[...keys.service(type, id)]] });

  const dirty =
    env !== (service.env ?? "") ||
    buildArgs !== (service.buildArgs ?? "") ||
    createEnvFile !== (service.createEnvFile ?? true);

  const onSave = () => {
    let input: Record<string, unknown>;
    if (type === "application") {
      input = {
        applicationId: id,
        env,
        buildArgs,
        buildSecrets: service.buildSecrets ?? "",
        createEnvFile,
      };
    } else if (type === "compose") {
      input = { composeId: id, env, createEnvFile };
    } else {
      input = { [cfg.idKey]: id, env };
    }
    save.mutate({
      procedure: `${type}.saveEnvironment`,
      input,
      success: "Saved. Redeploy to apply.",
    });
  };

  const mono_ = { fontFamily: mono, fontSize: 13 };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: space(4), gap: space(4), paddingBottom: space(10) }}>
        <Field
          label="Environment variables"
          value={env}
          onChangeText={setEnv}
          multiline
          placeholder={"KEY=value\nANOTHER_KEY=value"}
          style={[mono_, { minHeight: 220 }]}
          hint="One KEY=value per line. Changes apply on the next deploy."
        />
        {type === "application" ? (
          <Field
            label="Build-time arguments"
            value={buildArgs}
            onChangeText={setBuildArgs}
            multiline
            placeholder="NODE_ENV=production"
            style={mono_}
          />
        ) : null}
        {type === "application" || type === "compose" ? (
          <Card>
            <ToggleRow
              label="Create .env file"
              description="Write variables to a .env file in the build context"
              value={createEnvFile}
              onChange={setCreateEnvFile}
            />
          </Card>
        ) : null}
        <Button title="Save" icon="save-outline" onPress={onSave} loading={save.isPending} disabled={!dirty} />
        {!dirty ? <Text style={{ color: colors.faint, fontSize: 12, textAlign: "center" }}>No changes</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
