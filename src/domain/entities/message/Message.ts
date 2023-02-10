import type { IDiscordClient, IMessagePayload } from '@types';

import {
  Attachment,
  Channel,
  Component,
  Embed,
  Interaction,
  Application,
  Emoji,
  Role,
  Sticker,
  User,
  Member,
} from '../index';
import { Base } from '../base';

export class Message extends Base {
  id: string;
  author: Member | User;
  content: string;
  sentedAt: Date;
  editedAt: Date;
  isTTS: boolean;
  hasEveryoneMention: boolean;
  mentions: User[];
  roleMentions: string[];
  channelMentions: {
    id: string;
    guild_id: string;
    type: number;
    name: string;
  }[];
  attachments: Attachment[];
  embeds: Embed[];
  reactions?: {
    count: number;
    me: boolean;
    emoji: Emoji;
  };
  nonce?: number | string;
  isPinned: boolean;
  webhookID?: string;
  type: number;
  activity?: {
    type: number;
    party_id?: string;
  };
  application?: Application;
  applicationID?: string;
  messageReference?: {
    message_id?: string;
    channel_id?: string;
    guild_id?: string;
    fail_if_not_exists?: boolean;
  } | null;
  flags?: number;
  // eslint-disable-next-line no-use-before-define
  referencedMessage?: Message | null;
  interaction?: Interaction | null;
  thread?: Channel;
  components?: Component[];
  stickerItems?: {
    id: string;
    name: string;
    format_type: number;
  }[];
  stickers?: Sticker[];
  position?: number;
  boostRoleData?: {
    role_subscription_listing_id: string;
    tier_name: string;
    total_months_subscribed: number;
    is_renewal: boolean;
  };

  constructor(client: IDiscordClient, data?: any) {
    super(client, data);

    this.id = data.id;
    // eslint-disable-next-line operator-linebreak
    this.author = data.interaction.member?.user ? new Member(this.client, this.guild, data.member) :
      new User(this.client, data.interaction.user);
    this.content = data.content;
    this.sentedAt = new Date(data.timestamp);
    this.editedAt = new Date(data.edited_timestamp);
    this.isTTS = data.tts;
    this.hasEveryoneMention = data.mention_everyone;
    this.mentions = data.mentions.map((user) => new User(this.client, user));
    this.roleMentions = data.mention_roles.map((role) => new Role(this.client, this.guild, role));
    this.channelMentions = data.mention_channels;
    this.attachments = data.attachments.map((attachment) => new Attachment(this.client, attachment));
    this.embeds = data.embeds;
    this.reactions = data.reactions;
    this.nonce = data.nonce;
    this.isPinned = data.pinned;
    this.webhookID = data.webhook_id;
    this.type = data.type;
    this.activity = data.activity;
    this.application = data.application;
    this.applicationID = data.application_id;
    this.messageReference = data.message_reference ?? {
      guild_id: this.guild?.id ?? null,
      channel_id: this.channel?.id ?? data.channel_id,
      message_id: this.id,
    };
    this.flags = data.flags;
    this.referencedMessage = data.referencedMessage ? new Message(data.referenced_message) : null;
    this.interaction = data.interaction ? new Interaction(this.client, data.interaction) : null;
    this.thread = data.thread ? new Channel(this.client, data.thread) : null;
    this.components = data.components.map((component) => new Component(this.client, component));
    this.stickerItems = data.sticker_items;
    this.stickers = data.stickers ? data.stickers.map((sticker) => new Sticker(this.client, sticker)) : [];
    this.position = data.position;
    this.boostRoleData = data.role_subscription_data;
  }

  get guild() {
    // eslint-disable-next-line operator-linebreak
    return this.client.guilds.get(this.messageReference?.guild_id) ??
      this.client.guilds.find((guild) => guild.channels.find((channel) => channel.id === this.data.channel_id));
  }

  get channel() {
    return this.guild.channels.find((channel) => channel.id === this.data.channel_id);
  }

  crossPost() {
    this.client.rest.request('post', `/channels/${this.channel.id}/messages/${this.id}/crosspost`);
  }

  react(emoji: string) {
    this.client.rest.request('put', `/channels/${this.channel.id}/messages/${this.id}/reactions/${emoji}/@me`);
  }

  removeReaction(emoji: string, id?: string) {
    if (id)
      this.client.rest.request('delete', `/channels/${this.channel.id}/messages/${this.id}/reactions/${emoji}/${id}`);

    this.client.rest.request('delete', `/channels/${this.channel.id}/messages/${this.id}/reactions/${emoji}/@me`);
  }

  async getReactions(emoji: string) {
    const response = await this.client.rest
      .request('get', `/channels/${this.channel.id}/messages/${this.id}/reactions/${emoji}`);

    return response;
  }

  edit(data: IMessagePayload) {
    this.client.rest.request('patch', `/channels/${this.channel.id}/messages/${this.id}`, data);
  }

  reply(data: IMessagePayload) {
    this.client.rest.request('post', `/channels/${this.channel.id}/messages`, {
      ...data,
      message_reference: this.messageReference,
    });
  }

  delete() {
    this.client.rest.request('delete', `/channels/${this.channel.id}/messages/${this.id}`);
  }

  pin() {
    this.client.rest.request('put', `/channels/${this.channel.id}/pins/${this.id}`);
  }

  unpin() {
    this.client.rest.request('delete', `/channels/${this.channel.id}/pins/${this.id}`);
  }

  startThread(name: string) {
    this.client.rest.request('post', `/channels/${this.channel.id}/messages/${this.id}/threads`, { name });
  }
}