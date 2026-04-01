import { useSignIn } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function SignIn() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const [localError, setLocalError] = React.useState<string | null>(null);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [codeTouched, setCodeTouched] = React.useState(false);

  const isBusy = fetchStatus === "fetching";
  const emailTrimmed = emailAddress.trim();
  const canSubmit = isValidEmail(emailTrimmed) && !!password && !isBusy;

  const isVerify =
    signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor";

  const finalizeToApp = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log(session.currentTask);
          return;
        }

        const url = decorateUrl("/(tabs)");
        if (typeof window !== "undefined" && url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.replace(url as Href);
        }
      },
    });
  };

  const handleSubmit = async () => {
    setLocalError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isValidEmail(emailTrimmed)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    const { error } = await signIn.password({
      emailAddress: emailTrimmed,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setLocalError("That email or password doesn’t look right. Please try again.");
      return;
    }

    if (signIn.status === "complete") {
      await finalizeToApp();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
        return;
      }

      setLocalError("This sign-in needs extra verification. Please try again.");
      return;
    }

    // Other MFA strategies can be added later.
    console.error("Sign-in not complete:", signIn);
    setLocalError("We couldn’t finish signing you in. Please try again.");
  };

  const handleVerify = async () => {
    setLocalError(null);
    setCodeTouched(true);

    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 4) {
      setLocalError("Enter the verification code we sent to your email.");
      return;
    }

    await signIn.mfa.verifyEmailCode({ code: trimmed });

    if (signIn.status === "complete") {
      await finalizeToApp();
      return;
    }

    console.error("Sign-in not complete:", signIn);
    setLocalError("We couldn’t verify that code. Please try again.");
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">H</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Hagey</Text>
                <Text className="auth-wordmark-sub">SMART SPENDING</Text>
              </View>
            </View>

            <Text className="auth-title">{isVerify ? "Verify it’s you" : "Welcome back"}</Text>
            <Text className="auth-subtitle">
              {isVerify
                ? "Enter the code we sent to keep your account safe."
                : "Sign in to continue managing your subscriptions."}
            </Text>
          </View>

          <View className="auth-card">
            {isVerify ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={"auth-input"}
                    value={code}
                    onChangeText={setCode}
                    onBlur={() => setCodeTouched(true)}
                    placeholder="Enter code"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    keyboardType="numeric"
                    autoCorrect={false}
                    editable={!isBusy}
                  />
                  {(codeTouched && !!localError) || errors?.fields?.code ? (
                    <Text className="auth-error">
                      {errors?.fields?.code?.message ?? localError}
                    </Text>
                  ) : (
                    <Text className="auth-helper">Didn’t get it? You can request a new one.</Text>
                  )}
                </View>

                <Pressable
                  className={"auth-button" + (isBusy ? " auth-button-disabled" : "")}
                  onPress={handleVerify}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="auth-button-text">Verify & continue</Text>
                  )}
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={() => signIn.mfa.sendEmailCode()}
                  disabled={isBusy}
                >
                  <Text className="auth-secondary-button-text">Send a new code</Text>
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={() => signIn.reset()}
                  disabled={isBusy}
                >
                  <Text className="auth-secondary-button-text">Start over</Text>
                </Pressable>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={
                      "auth-input" +
                      ((emailTouched && !isValidEmail(emailTrimmed)) || errors?.fields?.identifier
                        ? " auth-input-error"
                        : "")
                    }
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!isBusy}
                  />
                  {errors?.fields?.identifier ? (
                    <Text className="auth-error">{errors.fields.identifier.message}</Text>
                  ) : emailTouched && !isValidEmail(emailTrimmed) ? (
                    <Text className="auth-error">Enter a valid email address.</Text>
                  ) : (
                    <Text className="auth-helper">Use the email associated with your account.</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={
                      "auth-input" +
                      ((passwordTouched && !password) || errors?.fields?.password
                        ? " auth-input-error"
                        : "")
                    }
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    secureTextEntry
                    editable={!isBusy}
                  />
                  {errors?.fields?.password ? (
                    <Text className="auth-error">{errors.fields.password.message}</Text>
                  ) : passwordTouched && !password ? (
                    <Text className="auth-error">Enter your password.</Text>
                  ) : (
                    <Text className="auth-helper">Keep it private — we’ll never ask for it by email.</Text>
                  )}
                </View>

                {localError ? <Text className="auth-error">{localError}</Text> : null}

                <Pressable
                  className={"auth-button" + (!canSubmit ? " auth-button-disabled" : "")}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isBusy ? <ActivityIndicator /> : <Text className="auth-button-text">Sign in</Text>}
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">New here?</Text>
                  <Link href="/(auth)/sign-up" asChild>
                    <Text className="auth-link">Create an account</Text>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
