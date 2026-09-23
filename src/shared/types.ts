export type TextureType =
  | 'print-paper'
  | 'woven-fabric'
  | 'fine-press'
  | 'aged-newsprint'
  | 'torinoko-washi'
  | 'parchment'

export interface Settings {
  enabled: boolean
  texture: TextureType
  /** Opacity in range 0.15–0.50 */
  intensity: number
}
