import { useClerk, useUser } from "@clerk/expo";
import images from "@/constants/images";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    user?.fullName || user?.firstName || user?.username || "Account owner";
  const joinedAt = user?.createdAt
    ? dayjs(user.createdAt).format("MMMM D, YYYY")
    : "Not available";
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-5xl font-sans-extrabold text-primary">Settings</Text>

      <View className="mt-6 gap-4">
        <View className="rounded-3xl border border-border bg-card p-5">
          <Text className="text-lg font-sans-bold text-primary">Account</Text>
          <View className="mt-4 flex-row items-center gap-4">
            <Image source={avatarSource} className="size-16 rounded-full" />
            <View className="flex-1">
              <Text className="text-lg font-sans-bold text-primary">{displayName}</Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                {primaryEmail ?? "Signed in"}
              </Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                Joined {joinedAt}
              </Text>
            </View>
          </View>
        </View>

        <Pressable className="auth-button" onPress={() => signOut()}>
          <Text className="auth-button-text">Sign out</Text>
        </Pressable>

        <View className="rounded-3xl border border-border bg-card p-5">
          <Text className="text-sm font-sans-medium text-muted-foreground">
            You’re signed in securely. If you’re on a shared device, sign out when you’re done.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
