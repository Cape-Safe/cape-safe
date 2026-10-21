// DocumentsSection.tsx
// Upload, view, replace and delete ID / medical aid / insurance documents.
// Files go to Firebase Storage. Nothing here logs file names, paths or URLs.

import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Button, Card, Input } from "@/components/ui/form";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";
import {
  deleteDocument,
  getPdfOpenUrl,
  loadImageDataUri,
  replaceDocument,
  uploadDocument,
  type PickedFile,
} from "@/services/documents";
import type { DocumentType, UserDocument } from "@/types";

import {
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENTS,
  validateDocumentFile,
} from "./profileValidation";

const TYPE_LABELS: Record<DocumentType, string> = {
  id: "ID or passport",
  medical_aid_card: "Medical aid card",
  insurance_policy: "Insurance policy",
  other: "Other",
};
const TYPES = Object.keys(TYPE_LABELS) as DocumentType[];

type Source = "library" | "camera" | "file";

async function pick(source: Source): Promise<PickedFile | null> {
  if (source === "file") {
    const r = await DocumentPicker.getDocumentAsync({
      type: [...ALLOWED_MIME_TYPES],
      copyToCacheDirectory: true,
    });
    if (r.canceled) return null;
    const a = r.assets[0];
    return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? "", sizeBytes: a.size };
  }

  if (source === "camera") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Allow camera access in your phone settings to take a photo of a document.");
      return null;
    }
  }
  // quality 0.7 compresses the photo before upload
  const options = { mediaTypes: ["images" as const], quality: 0.7 };
  const r =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (r.canceled) return null;
  const a = r.assets[0];
  return {
    uri: a.uri,
    name: a.fileName ?? "photo",
    mimeType: a.mimeType ?? "image/jpeg",
    sizeBytes: a.fileSize,
  };
}

function SourceButtons({ onPick, disabled }: { onPick: (s: Source) => void; disabled: boolean }) {
  const items: [Source, string][] = [
    ["library", "Photos"],
    ["camera", "Camera"],
    ["file", "File"],
  ];
  return (
    <View style={styles.sourceRow}>
      {items.map(([source, label]) => (
        <View key={source} style={styles.flex}>
          <Button label={label} disabled={disabled} onPress={() => onPick(source)} />
        </View>
      ))}
    </View>
  );
}

type Props = { uid: string; documents: UserDocument[]; loading: boolean; error: boolean };

export function DocumentsSection({ uid, documents, loading, error }: Props) {
  const theme = useTheme();
  const [type, setType] = useState<DocumentType>("id");
  const [label, setLabel] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ title: string; uri: string } | null>(null);
  const [viewBusy, setViewBusy] = useState(false);

  const busy = progress !== null;
  const full = documents.length >= MAX_DOCUMENTS;

  async function run(task: (file: PickedFile) => Promise<void>, source: Source) {
    try {
      const file = await pick(source);
      if (!file) return;
      const problem = validateDocumentFile(file, full && !replacingId ? MAX_DOCUMENTS : 0);
      if (problem) {
        Alert.alert("Can't add that file", problem);
        return;
      }
      setProgress(0);
      await task(file);
      setLabel("");
    } catch (err) {
      // Messages from our own services are safe to show. Never include file details.
      Alert.alert("Couldn't upload", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setProgress(null);
      setReplacingId(null);
    }
  }

  const add = (source: Source) =>
    run(
      (file) =>
        uploadDocument(uid, file, type, label || TYPE_LABELS[type], documents.length, setProgress),
      source,
    );

  const replace = (old: UserDocument, source: Source) =>
    run((file) => replaceDocument(uid, old, file, documents.length, setProgress), source);

  async function view(d: UserDocument) {
    setViewBusy(true);
    try {
      if (d.mimeType === "application/pdf") {
        // The link is used once, straight away. It is never stored or shown.
        await WebBrowser.openBrowserAsync(await getPdfOpenUrl(d));
      } else {
        setViewing({ title: d.label, uri: await loadImageDataUri(d) });
      }
    } catch {
      Alert.alert("Couldn't open the document", "Check your connection and try again.");
    } finally {
      setViewBusy(false);
    }
  }

  function confirmDelete(d: UserDocument) {
    Alert.alert("Delete this document?", `"${d.label}" will be removed from your account.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteDocument(uid, d).catch(() =>
            Alert.alert("Couldn't delete", "Check your connection and try again."),
          ),
      },
    ]);
  }

  return (
    <>
      <Card>
        <ScaledText type="heading" accessibilityRole="header">Documents</ScaledText>
        <ScaledText type="small" themeColor="textSecondary">
          JPEG, PNG or PDF, up to 5 MB each. You can store {MAX_DOCUMENTS}. Only you can open them.
        </ScaledText>

        <View style={styles.chips} accessibilityRole="radiogroup">
          {TYPES.map((t) => {
            const selected = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={TYPE_LABELS[t]}
                style={[styles.chip, { backgroundColor: selected ? "#062231" : theme.background, borderColor: theme.backgroundSelected }]}
              >
                <ScaledText type="smallBold" style={{ color: selected ? "#FFFFFF" : theme.text }}>{TYPE_LABELS[t]}</ScaledText>
              </Pressable>
            );
          })}
        </View>
        <Input value={label} onChangeText={setLabel} placeholder="Name (optional), e.g. Passport" accessibilityLabel="Document name" maxLength={100} />

        {full ? (
          <ScaledText type="small" style={styles.error}>
            You have {MAX_DOCUMENTS} documents. Delete one to add another.
          </ScaledText>
        ) : (
          <SourceButtons onPick={add} disabled={busy} />
        )}
        {busy && replacingId === null && (
          <ScaledText type="small" accessibilityLiveRegion="polite">
            Uploading… {Math.round((progress ?? 0) * 100)}%
          </ScaledText>
        )}
      </Card>

      {loading && <ActivityIndicator accessibilityLabel="Loading documents" />}
      {error && (
        <ScaledText type="small" style={styles.error}>
          Couldn&apos;t load your documents. Check your connection.
        </ScaledText>
      )}
      {!loading && !error && documents.length === 0 && (
        <ScaledText type="small" themeColor="textSecondary">No documents yet.</ScaledText>
      )}

      {documents.map((d) => (
        <Card key={d.id}>
          <ScaledText type="smallBold">{d.label}</ScaledText>
          <ScaledText type="small" themeColor="textSecondary">
            {TYPE_LABELS[d.type]} · {Math.max(1, Math.round(d.sizeBytes / 1024))} KB
            {d.uploadedAt ? ` · ${d.uploadedAt.toDate().toLocaleDateString()}` : ""}
          </ScaledText>
          <View style={styles.sourceRow}>
            <View style={styles.flex}><Button label="View" disabled={viewBusy} onPress={() => view(d)} /></View>
            <View style={styles.flex}><Button label="Replace" disabled={busy} onPress={() => setReplacingId(replacingId === d.id ? null : d.id)} /></View>
            <Pressable onPress={() => confirmDelete(d)} accessibilityRole="button" accessibilityLabel={`Delete ${d.label}`} style={styles.delete}>
              <ScaledText type="smallBold" style={styles.error}>Delete</ScaledText>
            </Pressable>
          </View>
          {replacingId === d.id && (
            <>
              <ScaledText type="small" themeColor="textSecondary">Replace with:</ScaledText>
              <SourceButtons onPick={(s) => replace(d, s)} disabled={busy} />
              {busy && (
                <ScaledText type="small" accessibilityLiveRegion="polite">
                  Uploading… {Math.round((progress ?? 0) * 100)}%
                </ScaledText>
              )}
            </>
          )}
        </Card>
      ))}

      <Modal visible={!!viewing} animationType="slide" onRequestClose={() => setViewing(null)}>
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <ScaledText type="heading" accessibilityRole="header">{viewing?.title}</ScaledText>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {viewing && (
              <Image source={{ uri: viewing.uri }} style={styles.image} contentFit="contain" accessibilityLabel={viewing.title} />
            )}
          </ScrollView>
          <Button label="Close" onPress={() => setViewing(null)} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  error: { color: "#B91C1C" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: { minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  sourceRow: { flexDirection: "row", gap: Spacing.two, alignItems: "center" },
  delete: { minHeight: 44, minWidth: 64, alignItems: "center", justifyContent: "center" },
  modal: { flex: 1, padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.three },
  modalBody: { flexGrow: 1 },
  image: { width: "100%", height: 480 },
});
