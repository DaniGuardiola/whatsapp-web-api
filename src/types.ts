interface IElements {
  app: Element
  msgList: Element
}

// base message
interface IMessageBase {
  forwarded: boolean
  time: {
    hour: number
    minute: number
  }
}

// message content
interface ITextMessageContent {
  text: string
}
interface IImageMessageContent {
  text?: string
  image: string
}
interface IVideoMessageContent {
  text?: string
  video: string
}
interface IVoiceMessageContent {
  audio: string
}
interface IAudioMessageContent {
  text?: string
  audio: string
}
interface IFileMessageContent {
  text?: string
  file: string
}

// message types
interface ITextMessage {
  type: 'text'
  content: ITextMessageContent
}
interface IImageMessage {
  type: 'image'
  content: IImageMessageContent
}
interface IVideoMessage {
  type: 'video'
  content: IVideoMessageContent
}
interface IVoiceMessage {
  type: 'voice'
  content: IVoiceMessageContent
}
interface IAudioMessage {
  type: 'audio'
  content: IAudioMessageContent
}
interface IFileMessage {
  type: 'file'
  content: IFileMessageContent
}
type ITypedMessage =
  | ITextMessage
  | IImageMessage
  | IVideoMessage
  | IVoiceMessage
  | IAudioMessage
  | IFileMessage

// message direction
interface IMessageIn {
  direction: 'in'
}
interface IMessageOut {
  direction: 'out'
  status: 'pending' | 'sent' | 'delivered' | 'read'
}
type IDirectionalMessage = IMessageIn | IMessageOut

// message
type IMessage = IMessageBase & ITypedMessage & IDirectionalMessage

// conversation items
interface ISystemItem {
  type: 'system'
}
interface IMessageItem {
  type: 'message'
  message: IMessage
}
type IConversationItem = ISystemItem | IMessageItem
