export interface CartoonAvatar {
  id: string;
  name: string;
  title: string;
  image: string;
  color: string;
  description: string;
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  {
    id: 'toon-orange',
    name: 'Sparky',
    title: 'Bazaar King',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/1.02464a56.png',
    color: '#F4845F',
    description: 'Fiery, fast, and always opens the center bazaar first!',
  },
  {
    id: 'toon-green',
    name: 'Clover',
    title: 'Mendicot Master',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/2.b977faab.png',
    color: '#6BBF7A',
    description: 'Calm and tactical. Hunts high cards and steals tricks!',
  },
  {
    id: 'toon-pink',
    name: 'Blossom',
    title: 'Quota Queen',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/3.4df853b4.png',
    color: '#E882B4',
    description: 'Playful and sharp. Always hits her 3-2-5 hand quota!',
  },
  {
    id: 'toon-blue',
    name: 'Splash',
    title: 'Sequence Shark',
    image: 'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc/4.4457fbce.png',
    color: '#6EB5FF',
    description: 'King of suit ladders. Drops blocks and empties hands!',
  },
  {
    id: 'ogre-8bit',
    name: 'Retro Ogre',
    title: 'The 8-Bit Boss',
    image: 'https://www.8bitcn.com/_next/image?url=%2Fimages%2F8bit-ogre.png&w=256&q=75&dpl=dpl_B9Q5u7DD6qZpoCz3VRwuR19npVHK',
    color: '#10b981',
    description: 'You made the Ogre angry! Unstoppable vintage arcade power.',
  },
];

export const DEFAULT_AVATAR = CARTOON_AVATARS[0];

export function getAvatarById(id?: string): CartoonAvatar {
  if (!id) return DEFAULT_AVATAR;
  return CARTOON_AVATARS.find(a => a.id === id) || DEFAULT_AVATAR;
}
