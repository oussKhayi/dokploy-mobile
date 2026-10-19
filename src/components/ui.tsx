import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  type ColorValue,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radius, space } from "../theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function Icon({ name, size = 18, color = colors.text }: { name: string; size?: number; color?: ColorValue }) {
  return <Ionicons name={name as IconName} size={size} color={color as string} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Row({
  title,
  subtitle,
  left,
  right,
  onPress,
  chevron = !!onPress,
}: {
  title: string;
  subtitle?: string | null;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.surface2 }]}
    >
      {left}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.rowSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron-forward" size={16} color={colors.faint} /> : null}
    </Pressable>
  );
}

const STATUS_COLOR: Record<string, string> = {
  running: colors.warning,
  done: colors.success,
  error: colors.danger,
  idle: colors.faint,
  cancelled: colors.faint,
};

const STATUS_LABEL: Record<string, string> = {
  running: "Deploying",
  done: "Running",
  error: "Error",
  idle: "Idle",
  cancelled: "Cancelled",
};

export function StatusDot({ status }: { status?: string }) {
  return <View style={[s.dot, { backgroundColor: STATUS_COLOR[status ?? "idle"] ?? colors.faint }]} />;
}

export function StatusBadge({ status, deployment }: { status?: string; deployment?: boolean }) {
  const c = STATUS_COLOR[status ?? "idle"] ?? colors.faint;
  const label = deployment
    ? ({ running: "Running", done: "Done", error: "Error", cancelled: "Cancelled", idle: "Queued" } as Record<string, string>)[
        status ?? "idle"
      ]
    : STATUS_LABEL[status ?? "idle"];
  return (
    <View style={[s.badge, { borderColor: c + "66", backgroundColor: c + "1f" }]}>
      <StatusDot status={status} />
      <Text style={[s.badgeText, { color: c }]}>{label ?? status}</Text>
    </View>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{children}</Text>
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
};

export function Button({ title, onPress, icon, variant = "primary", loading, disabled, style, small }: ButtonProps) {
  const fg =
    variant === "primary" ? colors.onPrimary : variant === "danger" ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        variant === "primary" && { backgroundColor: colors.primary, borderColor: colors.primary },
        variant === "secondary" && { backgroundColor: colors.surface2 },
        variant === "danger" && { backgroundColor: colors.danger + "14", borderColor: colors.danger + "55" },
        variant === "ghost" && { backgroundColor: "transparent", borderColor: "transparent" },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <Icon name={icon} size={small ? 15 : 17} color={fg} />
      ) : null}
      <Text style={[s.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: space(1.5) }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        style={[s.input, props.multiline && { minHeight: 120, textAlignVertical: "top" }, props.style]}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{label}</Text>
        {description ? <Text style={s.rowSub}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.success, false: colors.border }}
        thumbColor={colors.text}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segItem, active && s.segActive]}>
            <Text style={[s.segText, active && { color: colors.text }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.muted} />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={s.center}>
      <Icon name="warning-outline" size={28} color={colors.danger} />
      <Text style={[s.rowSub, { textAlign: "center", marginVertical: space(3) }]}>
        {(error as Error)?.message ?? "Something went wrong"}
      </Text>
      {onRetry ? <Button title="Retry" variant="secondary" onPress={onRetry} small /> : null}
    </View>
  );
}

export function Empty({ icon = "file-tray-outline", text }: { icon?: string; text: string }) {
  return (
    <View style={[s.center, { paddingVertical: space(10) }]}>
      <Icon name={icon} size={28} color={colors.faint} />
      <Text style={[s.rowSub, { marginTop: space(2) }]}>{text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space(5),
    marginBottom: space(2),
    paddingHorizontal: space(1),
  },
  sectionTitle: { color: colors.muted, fontSize: 12, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "500" },
  rowSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  tag: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tagText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space(2),
    height: 46,
    paddingHorizontal: space(4),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSmall: { height: 36, paddingHorizontal: space(3) },
  btnText: { fontSize: 15, fontWeight: "600" },
  label: { color: colors.text, fontSize: 14, fontWeight: "500" },
  hint: { color: colors.faint, fontSize: 12 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: space(3.5),
    paddingVertical: space(3),
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  seg: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  segItem: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: radius.sm },
  segActive: { backgroundColor: colors.surface2 },
  segText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space(6) },
});
