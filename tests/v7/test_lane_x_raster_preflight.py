"""Technical regression tests; does not grant artistic approval."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
from scripts.v7_lane_x_raster_preflight import inspect_image


class RasterPreflightTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def build(self,name,size,with_grid=False,window=False,format='PNG'):
        img=Image.new('RGB',size,(125,161,177))
        draw=ImageDraw.Draw(img)
        if with_grid:
            w,h=size
            for x in [w//5,w*2//5,w*3//5,w*4//5]:
                draw.rectangle((x-7,0,x+7,h),fill='white')
            draw.rectangle((0,h//2-7,w,h//2+7),fill='white')
        if window:
            draw.rectangle((size[0]//3,0,size[0]//3+6,size[1]),fill='white')
        path=self.root/name
        img.save(path,format=format)
        return path

    def test_single_scene_square_passes_technical_but_not_artistic_approval(self):
        image=self.build('emotion.png',(1536,1536),window=True)
        result=inspect_image(image,'emotion')
        self.assertEqual(result['reasons'],[])
        self.assertEqual(result['status'],'TECHNICAL_PREFLIGHT_PASS_VISUAL_QA_REQUIRED')
        self.assertEqual(result['sha256'],hashlib.sha256(image.read_bytes()).hexdigest())
        self.assertEqual(result['decodedFormat'],'PNG')

    def test_single_scene_need_portrait_passes_technical_preflight(self):
        result=inspect_image(self.build('need.webp',(1280,1600),format='WEBP'),'need')
        self.assertEqual(result['reasons'],[])
        self.assertEqual(result['decodedFormat'],'WEBP')

    def test_high_resolution_hero_is_not_rejected_for_single_white_window_trim(self):
        result=inspect_image(self.build('hero.png',(1920,1080),window=True),'hero')
        self.assertEqual(result['reasons'],[])

    def test_high_resolution_grid_is_rejected_despite_correct_ratio(self):
        for kind,size in [('emotion',(1536,1536)),('need',(1280,1600)),('hero',(1920,1080))]:
            with self.subTest(kind=kind):
                result=inspect_image(self.build('sheet_'+kind+'.png',size,with_grid=True),kind)
                self.assertIn('suspected_multi_panel_collage_or_contact_sheet',result['reasons'])
                self.assertEqual(result['status'],'REJECT')

    def test_wrong_ratio_and_upscaled_tiny_source_are_not_accepted(self):
        result=inspect_image(self.build('tiny.png',(250,250)),'need')
        self.assertIn('wrong_original_scene_aspect_ratio',result['reasons'])
        self.assertIn('insufficient_original_raster_resolution',result['reasons'])

    def test_renamed_or_malformed_file_is_not_a_raster(self):
        p=self.root/'fake.png'
        p.write_text('<svg>not a PNG</svg>')
        result=inspect_image(p,'emotion')
        self.assertTrue(any(x.startswith('raster_decode_failure') for x in result['reasons']))

    def test_missing_file_is_rejected(self):
        self.assertEqual(inspect_image(self.root/'missing.webp','hero')['reasons'],['file_not_found'])


if __name__=='__main__':
    unittest.main()
