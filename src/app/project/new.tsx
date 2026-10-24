import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Field } from "../../components/ui";
import { useAction } from "../../lib/hooks";
import { keys, useProjects } from "../../lib/queries";
import { space } from "../../theme";

/** Create a project, or edit one when `projectId` is passed. */
export default function ProjectForm() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const router = useRouter();
  const { data } = useProjects();
  const existing = projectId ? data?.find((p) => p.projectId === projectId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const save = useAction({ invalidate: [[...keys.projects], ["homeStats"]] });

  const submit = () =>
    save.mutate(
      existing
        ? {
            procedure: "project.update",
            input: { projectId: existing.projectId, name: name.trim(), description },
            success: "Project updated",
          }
        : { procedure: "project.create", input: { name: name.trim(), description }, success: "Project created" },
      { onSuccess: (r) => !r.skipped && router.back() },
    );

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), gap: space(4) }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: existing ? "Edit project" : "New project" }} />
      <Field label="Name" value={name} onChangeText={setName} placeholder="my-project" autoFocus />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional" multiline />
      <Button
        title={existing ? "Save" : "Create project"}
        icon={existing ? "save-outline" : "add"}
        onPress={submit}
        loading={save.isPending}
        disabled={!name.trim()}
      />
    </ScrollView>
  );
}
