import { useRef } from "react";
import { ScrollView, Text, View, type ScrollViewInstance } from "react-native";
import { colors, mono, radius, space } from "../theme";

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

export function cleanLogs(raw: unknown): string {
  if (raw == null) return "";
  const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
  return text.replace(ANSI, "").replace(/\r/g, "");
}

export function LogView({ text, empty = "No logs yet" }: { text: string; empty?: string }) {
  const ref = useRef<ScrollViewInstance>(null);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050506",
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      <ScrollView
        ref={ref}
        onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={{ padding: space(3) }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text selectable style={{ color: "#d4d4d8", fontFamily: mono, fontSize: 11.5, lineHeight: 16 }}>
            {text || empty}
          </Text>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
