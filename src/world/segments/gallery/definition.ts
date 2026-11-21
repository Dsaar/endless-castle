import { straightPlan, type SegmentDefinition } from '../../segment'
import { generateGallery, type GalleryParams } from './layout'
import OpenGallery from './OpenGallery'

export const galleryDefinition: SegmentDefinition<GalleryParams> = {
  kind: 'gallery',
  area: 'The Open Gallery',
  kanji: '縁側',
  generate: (rand) => generateGallery(rand),
  plan: (p) => straightPlan(p.length),
  Component: OpenGallery,
}
