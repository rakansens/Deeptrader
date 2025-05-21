import { render, fireEvent } from "@testing-library/react";
import Chat from "@/components/chat/Chat";
import { useScreenshot } from "@/hooks/use-screenshot";
import { useSettings } from "@/hooks/use-settings";
import { useVoiceInput } from "@/hooks/use-voice-input";

jest.mock("@/hooks/use-settings");
jest.mock("@/hooks/use-screenshot");
jest.mock("@/hooks/use-voice-input");

describe("Chat keyboard shortcuts", () => {
  it("triggers actions on hotkeys", () => {
    const toggleSidebar = jest.fn();
    const captureScreenshot = jest.fn();
    const toggleListening = jest.fn();

    jest.spyOn(require("@/hooks/use-chat"), "useChat").mockReturnValue({
      messages: [],
      input: "",
      setInput: jest.fn(),
      loading: false,
      error: null,
      conversations: [],
      selectedId: "1",
      selectConversation: jest.fn(),
      newConversation: jest.fn(),
      renameConversation: jest.fn(),
      removeConversation: jest.fn(),
      sidebarOpen: false,
      toggleSidebar,
      sendMessage: jest.fn(),
      sendImageMessage: jest.fn(),
    } as any);
    (useScreenshot as jest.Mock).mockReturnValue({ captureScreenshot });
    (useSettings as jest.Mock).mockReturnValue({
      voiceInputEnabled: true,
      setVoiceInputEnabled: jest.fn(),
      speechSynthesisEnabled: false,
      setSpeechSynthesisEnabled: jest.fn(),
      refreshSettings: jest.fn(),
    });
    (useVoiceInput as jest.Mock).mockReturnValue({
      isListening: false,
      startListening: jest.fn(),
      stopListening: jest.fn(),
      toggleListening,
    });

    render(<Chat />);

    fireEvent.keyDown(window, { key: "s", ctrlKey: true, shiftKey: true });
    expect(captureScreenshot).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(toggleSidebar).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "m", ctrlKey: true });
    expect(toggleListening).toHaveBeenCalled();
  });
});
