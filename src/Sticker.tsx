type StickerName = 'cutlery' | 'diner' | 'stools' | 'table' | 'supper' | 'friends' | 'martini' | 'goblet' | 'tumbler' | 'rocks'

export function Sticker({name, placement}:{name:StickerName;placement:string}) {
  return <img
    src={import.meta.env.BASE_URL + 'stickers/' + name + '.webp'}
    className={'sticker ' + placement}
    alt=""
    loading={placement === 'sticker-hero' ? 'eager' : 'lazy'}
    decoding="async"
  />
}
