import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Field, Segmented } from "../../components/ui";
import { useAction } from "../../lib/hooks";
import { keys } from "../../lib/queries";
import { colors, space } from "../../theme";

export default function NewUser() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const create = useAction({ invalidate: [[...keys.members]] });

  const submit = () =>
    create.mutate(
      {
        procedure: "user.createUserWithCredentials",
        input: { email: email.trim(), password, role },
        success: "User created",
      },
      { onSuccess: (r) => !r.skipped && router.back() },
    );

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), gap: space(4) }}>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="user@example.com" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 8 characters"
        hint="Share it with the user. They can change it after signing in."
      />
      <View style={{ gap: space(2) }}>
        <Text style={{ color: colors.text, fontWeight: "500" }}>Role</Text>
        <Segmented
          value={role}
          onChange={setRole}
          options={[
            { value: "member", label: "Member" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <Text style={{ color: colors.faint, fontSize: 12 }}>
          Members only see the projects you grant them. Admins see everything.
        </Text>
      </View>
      <Button
        title="Create user"
        icon="person-add-outline"
        onPress={submit}
        loading={create.isPending}
        disabled={!email.includes("@") || password.length < 8}
      />
      <Text style={{ color: colors.faint, fontSize: 12, textAlign: "center" }}>
        Available on self-hosted Dokploy only.
      </Text>
    </ScrollView>
  );
}
