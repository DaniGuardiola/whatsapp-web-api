export default class API {
  parsingDate?: string
  elements?: IElements

  refreshElements (): void {
    const app = document.querySelector('#app .app-wrapper-web')
    const msgList = app?.querySelector(
      '#main .copyable-area div[data-tab="2"][role="region"]'
    )

    if (!app || !msgList)
      throw new Error('Unexpected error locating DOM elements')

    this.elements = { app, msgList }
  }

  getCurrentConversationElements (): Element[] {
    this.refreshElements()
    const msgList = this.elements?.msgList

    if (!msgList)
      throw new Error('Unexpected error retrieving message elements')

    return [].slice.call(msgList.children)
  }

  parseConversationElement (element: Element): IConversationItem {
    if (
      element.classList.contains('message-out') ||
      element.classList.contains('message-in')
    ) {
      let directionalMessage: IDirectionalMessage
      if (element.classList.contains('message-out')) {
        directionalMessage = {
          direction: 'out',
          status: this.parseStatus(element)
        }
      }
      if (element.classList.contains('message-in')) {
        directionalMessage = {
          direction: 'in'
        }
      }
      return {
        type: 'message',
        message: {
          ...directionalMessage,
          forwarded: this.parseForwarded(element),
          ...this.parseMessage(element),
          time: this.parseTime(element)
        }
      }
    }
    return {
      type: 'system'
    }
  }

  parseTime (element: Element) {
    const timeString = element.querySelector('span[dir="auto"]').textContent
    if (!timeString) {
      console.warn('wtf time', element)
      return {
        hour: -1,
        minute: -1
      }
    }

    // extract info from string
    const stringParts = timeString.split(' ')
    const numberParts = stringParts[0].split(':')
    const origHour = +numberParts[0]
    const minute = +numberParts[1]
    const amPm = stringParts[1]

    // convert from 12h to 24h format
    let amPmModifier: number = 0
    if (amPm === 'PM' && origHour < 12) amPmModifier = 12
    if (amPm === 'AM' && origHour === 12) amPmModifier = -12
    const hour = origHour + amPmModifier

    return { hour, minute }
  }

  parseMessage (element: Element): ITypedMessage {
    // message type
    if (element.querySelector('img[style="height: 100%;"]')) {
      const image = element.querySelector(
        'img[src^="blob"]'
      ) as HTMLImageElement
      return {
        type: 'image',
        content: {
          text: this.parseText(element),
          image: image.src
        }
      }
    }
    if (element.querySelector('span[aria-label="Voice message"]')) {
      return {
        type: 'voice',
        content: {
          audio: 'TODO'
        }
      }
    }
    if (element.querySelector('span[data-testid="ptt-status"]')) {
      return {
        type: 'audio',
        content: {
          text: this.parseText(element),
          audio: 'TODO'
        }
      }
    }
    if (element.querySelector('span[data-testid="media-play"]')) {
      return {
        type: 'video',
        content: {
          text: this.parseText(element),
          video: 'TODO'
        }
      }
    }
    // TODO: stickers
    return {
      type: 'text',
      content: {
        text: this.parseText(element)
      }
    }
  }

  parseSpan (span: HTMLSpanElement) {
    const fragments: string[] = []
    span.childNodes.forEach((el: Element) => {
      if (el.nodeType === 1 && el.tagName === 'SPAN') {
        const innerSpan = el as HTMLSpanElement
        fragments.push(this.parseSpan(innerSpan))
      }
      if (el.nodeType === 3) fragments.push(el.textContent)
      if (el.nodeType === 1 && el.tagName === 'IMG') {
        const image = el as HTMLImageElement
        fragments.push(image.alt)
      }
    })
    return fragments.join('')
  }

  parseText (element: Element) {
    const span: HTMLSpanElement = element.querySelector(
      '.copyable-text .selectable-text'
    )
    if (!span) {
      console.warn('wtf', element)
      return null
    }
    return this.parseSpan(span)
  }

  parseForwarded (element: Element): boolean {
    return !!element.querySelector('span[data-icon="forwarded"]')
  }

  parseStatus (element: Element): IMessageOut['status'] {
    // message status
    let status = null
    if (element.querySelector('span[data-icon="msg-time"]')) {
      status = 'pending'
    } else if (element.querySelector('span[data-icon="msg-check"]')) {
      status = 'sent'
    } else if (element.querySelector('span[data-icon="msg-dblcheck"]')) {
      const icon = element.querySelector('span[data-icon="msg-dblcheck"]')
      if (!icon) throw new Error('Unexpected error parsing a message')
      const { color } = window.getComputedStyle(icon)
      if (color === 'rgb(79, 195, 247)') status = 'read'
      else status = 'delivered'
    }

    return status
  }

  getCurrentConversation () {
    const elements = this.getCurrentConversationElements()
    const conversationItems = elements.map((el: Element) =>
      this.parseConversationElement(el)
    )
    // do stuff with system messages
    const messageItems = conversationItems.filter(
      item => item.type === 'message'
    ) as IMessageItem[]
    return messageItems.map(item => item.message)
  }
}
