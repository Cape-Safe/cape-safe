// ProfileFields.tsx
// The input sections of the emergency profile form. Pure presentation: the
// screen owns the state and the validation errors.

import { Pressable, StyleSheet, View } from "react-native";

import { Button, Card, Input } from "@/components/ui/form";
import { Spacing } from "@/constants/theme";
import { ScaledText } from "@/features/settings/ScaledText";
import { useTheme } from "@/hooks/use-theme";

import {
  BLOOD_TYPES,
  MAX_NEXT_OF_KIN,
  type FieldErrors,
  type ProfileForm,
} from "./profileValidation";

type Props = {
  form: ProfileForm;
  errors: FieldErrors;
  onChange: (patch: Partial<ProfileForm>) => void;
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numbers-and-punctuation";
  autoComplete?: "tel" | "email" | "name" | "off";
};

function Field({ label, error, multiline, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <ScaledText type="smallBold">{label}</ScaledText>
      <Input
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        autoCapitalize={rest.keyboardType === "email-address" ? "none" : "sentences"}
        style={multiline ? styles.multiline : undefined}
      />
      {error ? (
        <ScaledText type="small" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </ScaledText>
      ) : null}
    </View>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card>
      <ScaledText type="heading" accessibilityRole="header">{title}</ScaledText>
      {hint ? <ScaledText type="small" themeColor="textSecondary">{hint}</ScaledText> : null}
      {children}
    </Card>
  );
}

export function ProfileFields({ form, errors, onChange }: Props) {
  const theme = useTheme();

  const setKin = (index: number, patch: Partial<ProfileForm["nextOfKin"][number]>) =>
    onChange({
      nextOfKin: form.nextOfKin.map((k, i) => (i === index ? { ...k, ...patch } : k)),
    });

  return (
    <>
      <Section title="About you" hint="Helps responders and your embassy identify you.">
        <Field label="Full legal name" value={form.fullName} onChangeText={(v) => onChange({ fullName: v })} error={errors.fullName} autoComplete="name" />
        <Field label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => onChange({ dateOfBirth: v })} error={errors.dateOfBirth} placeholder="1990-04-21" keyboardType="numbers-and-punctuation" />
        <Field label="Nationality" value={form.nationality} onChangeText={(v) => onChange({ nationality: v })} error={errors.nationality} />
        <Field label="Home country" value={form.homeCountry} onChangeText={(v) => onChange({ homeCountry: v })} error={errors.homeCountry} />
        <Field label="Passport or ID number" value={form.idNumber} onChangeText={(v) => onChange({ idNumber: v })} error={errors.idNumber} />
        <Field label="Your phone number" value={form.phone} onChangeText={(v) => onChange({ phone: v })} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" placeholder="+27 82 123 4567" />
      </Section>

      <Section title="Medical" hint="Only add what you are comfortable sharing in an emergency.">
        <ScaledText type="smallBold">Blood type</ScaledText>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {BLOOD_TYPES.map((t) => {
            const selected = form.bloodType === t;
            return (
              <Pressable
                key={t}
                onPress={() => onChange({ bloodType: selected ? "" : t })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Blood type ${t}`}
                style={[styles.chip, { backgroundColor: selected ? "#062231" : theme.background, borderColor: theme.backgroundSelected }]}
              >
                <ScaledText type="smallBold" style={{ color: selected ? "#FFFFFF" : theme.text }}>{t}</ScaledText>
              </Pressable>
            );
          })}
        </View>
        {errors.bloodType ? <ScaledText type="small" style={styles.error}>{errors.bloodType}</ScaledText> : null}
        <Field label="Allergies" value={form.allergies} onChangeText={(v) => onChange({ allergies: v })} error={errors.allergies} />
        <Field label="Chronic conditions" value={form.conditions} onChangeText={(v) => onChange({ conditions: v })} error={errors.conditions} />
        <Field label="Current medication" value={form.medication} onChangeText={(v) => onChange({ medication: v })} error={errors.medication} />
        <Field label="Other medical notes" value={form.medicalNotes} onChangeText={(v) => onChange({ medicalNotes: v })} error={errors.medicalNotes} multiline />
      </Section>

      <Section title="Medical aid or travel insurance">
        <Field label="Provider" value={form.aidProvider} onChangeText={(v) => onChange({ aidProvider: v })} error={errors.aidProvider} />
        <Field label="Policy or member number" value={form.aidMemberNumber} onChangeText={(v) => onChange({ aidMemberNumber: v })} error={errors.aidMemberNumber} />
        <Field label="Plan name" value={form.aidPlanName} onChangeText={(v) => onChange({ aidPlanName: v })} error={errors.aidPlanName} />
        <Field label="Emergency assistance phone" value={form.aidAssistancePhone} onChangeText={(v) => onChange({ aidAssistancePhone: v })} error={errors.aidAssistancePhone} keyboardType="phone-pad" placeholder="+44 20 1234 5678" />
        <Field label="Expiry date (YYYY-MM-DD)" value={form.aidExpiry} onChangeText={(v) => onChange({ aidExpiry: v })} error={errors.aidExpiry} keyboardType="numbers-and-punctuation" />
      </Section>

      <Section title="Next of kin" hint={`Up to ${MAX_NEXT_OF_KIN} people. Shown with a call button on the SOS screen.`}>
        {form.nextOfKin.map((k, i) => (
          <View key={i} style={[styles.kin, { borderColor: theme.backgroundSelected }]}>
            <ScaledText type="smallBold">Person {i + 1}</ScaledText>
            <Field label={`Name (person ${i + 1})`} value={k.name} onChangeText={(v) => setKin(i, { name: v })} error={errors[`nextOfKin.${i}.name`]} autoComplete="name" />
            <Field label={`Relationship (person ${i + 1})`} value={k.relationship} onChangeText={(v) => setKin(i, { relationship: v })} />
            <Field label={`Phone (person ${i + 1})`} value={k.phone} onChangeText={(v) => setKin(i, { phone: v })} error={errors[`nextOfKin.${i}.phone`]} keyboardType="phone-pad" autoComplete="tel" />
            <Field label={`Email (person ${i + 1})`} value={k.email} onChangeText={(v) => setKin(i, { email: v })} error={errors[`nextOfKin.${i}.email`]} keyboardType="email-address" autoComplete="email" />
            <Field label={`Country (person ${i + 1})`} value={k.country} onChangeText={(v) => setKin(i, { country: v })} />
            <Pressable
              onPress={() => onChange({ nextOfKin: form.nextOfKin.filter((_, j) => j !== i) })}
              accessibilityRole="button"
              accessibilityLabel={`Remove person ${i + 1}`}
              style={styles.remove}
            >
              <ScaledText type="smallBold" style={styles.error}>Remove</ScaledText>
            </Pressable>
          </View>
        ))}
        {errors.nextOfKin ? <ScaledText type="small" style={styles.error}>{errors.nextOfKin}</ScaledText> : null}
        {form.nextOfKin.length < MAX_NEXT_OF_KIN && (
          <Button
            label="Add a person"
            onPress={() =>
              onChange({
                nextOfKin: [...form.nextOfKin, { name: "", relationship: "", phone: "", email: "", country: "" }],
              })
            }
          />
        )}
      </Section>

      <Section title="Where you're staying (optional)">
        <Field label="Accommodation name" value={form.accommodationName} onChangeText={(v) => onChange({ accommodationName: v })} error={errors.accommodationName} />
        <Field label="Accommodation address" value={form.accommodationAddress} onChangeText={(v) => onChange({ accommodationAddress: v })} error={errors.accommodationAddress} multiline />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  error: { color: "#B91C1C" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    minHeight: 44,
    minWidth: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kin: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  remove: { minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
});
