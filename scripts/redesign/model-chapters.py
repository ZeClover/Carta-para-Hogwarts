"""Original period-inspired meshes. Reproduce: blender -b -t 2 -P this-file.
No image generation, external services, or game assets. GLBs are local CC0 geometry.
Blender coordinates X right, Z up, -Y front; export converts to glTF Y up, +Z front.
"""
import bpy, math, json, hashlib, pathlib, random
from mathutils import Vector
import argparse, sys
parser=argparse.ArgumentParser();parser.add_argument("--chapters",nargs="+",default=["I","II","III","IV","V","VI","VII"])
args=parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'public/assets/redesign'; OUT.mkdir(parents=True,exist_ok=True)
manifest=[]

def material(name,color,metal=0,rough=.6):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
wood=material('Walnut · aged satin',(.19,.095,.047),0,.65)
edgewood=material('Walnut edge',(.27,.15,.075),0,.58)
paper=material('Cotton paper ivory',(.77,.68,.49),0,.94)
leather=material('Oxblood leather',(.11,.037,.032),0,.82)
brass=material('Aged brass',(.42,.30,.125),.78,.36)
darkbrass=material('Patinated brass',(.20,.17,.11),.64,.54)
ink=material('Ink bottle glass',(.032,.057,.048),.25,.23)
blue=material('Celestial ink',(.022,.071,.115),0,.83)
wax=material('Burgundy wax',(.26,.034,.048),0,.46)
glass=material('Aged mirror',(.54,.60,.57),.92,.19)
cloth=material('Album linen',(.30,.25,.18),0,.96)

def smooth(o):
 for p in o.data.polygons:p.use_smooth=True
 return o

def box(name,loc,size,mat,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if bevel:
  b=o.modifiers.new('Rounded worn edges','BEVEL');b.width=min(bevel,min(size)/3);b.segments=3
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
 n=o.modifiers.new('Weighted contact normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=n.name)
 return o

def sphere(name,loc,size,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat);return smooth(o)

def cyl(name,loc,r,depth,mat,rotation=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(mat)
 if rotation:o.rotation_euler=rotation
 b=o.modifiers.new('Edge radius','BEVEL');b.width=min(.018,depth/4);b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
 return smooth(o)

def tube(name,points,r,mat,closed=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=r;c.bevel_resolution=2
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return bpy.context.view_layer.objects.active

def ring(name,loc,r,thick,mat,plane='xy'):
 x,y,z=loc
 points=[(x+r*math.cos(a),y+r*math.sin(a),z) if plane=='xy' else (x+r*math.cos(a),y,z+r*math.sin(a)) for a in [i*math.tau/64 for i in range(64)]]
 return tube(name,points,thick,mat,True)

def relief_leaf(loc,angle,size=.16):
 x,y,z=loc;vs=[]
 for i in range(13):
  t=i/12;w=math.sin(t*math.pi)*size*.27;d=t*size
  for side in [-1,1]:vs.append((x+d*math.cos(angle)-side*w*math.sin(angle),y-.025*math.sin(t*math.pi),z+d*math.sin(angle)+side*w*math.cos(angle)))
 faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(12)];me=bpy.data.meshes.new('Acanthus leaf');me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new('Hand-shaped leaf relief',me);bpy.context.collection.objects.link(o);o.data.materials.append(brass)
 s=o.modifiers.new('Relief thickness','SOLIDIFY');s.thickness=.012;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=s.name)
 smooth(o)

def envelope():
 box('Folded envelope shell',(0,0,.035),(2.2,1.45,.06),paper)
 for sign in [-1,1]:
  tube('Diagonal fold',[(sign*1.07,.67,.071),(0,-.2,.072),(sign*1.07,-.66,.071)],.003,darkbrass)
 random.seed(1890);cyl('Pressed wax seal',(0,-.2,.103),.16,.05,wax)
 for i in range(20):
  a=i*math.tau/20;r=.153+random.random()*.014;sphere('Uneven wax edge',(r*math.cos(a),-.2+r*math.sin(a),.095),(.025,.025,.018),wax)
 ring('Seal raised rim',(0,-.2,.133),.105,.006,brass)
 for x in [-.027,.027]:box('Embossed H',(x,-.2,.137),(.011,.078,.006),brass,.001)
 box('Embossed H bar',(0,-.2,.137),(.064,.011,.006),brass,.001)
 for i in range(3):box('Paper block edge',(0,0,.004+i*.01),(2.16,1.4,.009),paper,.003)

def album():
 for x in [-.73,.73]:
  box('Leather board',(x,0,.04),(1.40,1.85,.085),leather)
  box('Linen inset',(x,0,.087),(1.29,1.72,.01),cloth,.005)
  for sign in [-1,1]:
   for y in [-.85,.85]:
    box('Brass corner',(x+sign*.60,y,.098),(.11,.08,.02),brass,.009)
  for i in range(6):box('Deckled photo sheet',(x,0,.1+i*.012),(1.28+(i%3)*.006,1.70,.012),paper,.003)
 for y in [-.64,-.32,0,.32,.64]:
  cyl('Raised spine band',(0,y,.067),.11,.07,leather,(math.pi/2,0,0))
 for x in [-.075,.075]:tube('Spine stitching',[(x,-.83,.126),(x,.83,.126)],.003,brass)

def memory():
 # Neutral writing implements; no invented photograph or childhood event.
 cyl('Octagonal ink bottle foot',(.48,0,.06),.23,.10,darkbrass)
 sphere('Faceted ink bottle',(.48,0,.29),(.21,.21,.23),ink)
 cyl('Bottle neck',(.48,0,.49),.105,.17,ink)
 cyl('Brass bottle lip',(.48,0,.57),.112,.034,brass)
 box('Cotton writing card',(-.20,-.15,.025),(1.30,.92,.035),paper,.009)
 tube('Dip pen shaft',[(-.75,.20,.05),(.24,.35,.12)],.015,wood)
 tube('Split nib',[(.24,.35,.12),(.42,.38,.09)],.021,brass)
 # Lightweight abstract folded sheet, subdivided and curved around a visible edge.
 vs=[];faces=[]
 for j in range(9):
  for i in range(17):
   x=-.72+i*.075;y=-.35+j*.085;z=.12+.18*math.sin(i/16*math.pi)+.035*math.sin(j/8*math.pi);vs.append((x,y,z))
 for j in range(8):
  for i in range(16):
   a=j*17+i;faces.append((a,a+1,a+18,a+17))
 me=bpy.data.meshes.new('Curved suspended cotton sheet');me.from_pydata(vs,[],faces);me.update();o=bpy.data.objects.new('Memory suspended paper',me);bpy.context.collection.objects.link(o);o.data.materials.append(paper);smooth(o)

def window():
 # Leaded glass with real framing profiles and a deep sill.
 box('Window backing',(0,.10,1.65),(2.8,.04,3.3),blue)
 for x in [-1.48,1.48]:
  box('Carved jamb',(x,0,1.65),(.16,.26,3.6),wood)
  box('Jamb moulding',(x,-.15,1.65),(.06,.045,3.65),edgewood,.016)
 for z in [.03,3.36]:box('Window rail',(0,0,z),(3.13,.24,.16),wood)
 box('Sill',(0,-.14,-.03),(3.45,.66,.13),edgewood,.035)
 for x in [-.73,0,.73]:box('Mullion',(x,-.085,1.65),(.045,.08,3.25),darkbrass,.01)
 for z in [.85,1.65,2.45]:box('Transom',(0,-.085,z),(2.8,.08,.045),darkbrass,.01)
 for x in [-.37,.37]:
  for z in [.85,2.45]:ring('Leaded circular pane',(x,-.11,z),.28,.008,brass,'xz')
 cyl('Moon',(0.79,.065,2.82),.21,.012,paper,(math.pi/2,0,0))

def mirror():
 # New verified CC0 carved frame, remodeled as a standing mirror. The old ornate_mirror_01 is not reused.
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/fancy_picture_frame_02.glb'))
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 corners=[o.matrix_world@Vector(c) for o in obs for c in o.bound_box]
 lo=Vector([min(c[k] for c in corners) for k in range(3)]);hi=Vector([max(c[k] for c in corners) for k in range(3)])
 factor=3.05/(hi.z-lo.z)
 for o in obs:
  for v in o.data.vertices:
   point=o.matrix_world@v.co
   v.co=Vector(((point.x-(hi.x+lo.x)/2)*factor,(point.y-(hi.y+lo.y)/2)*factor,(point.z-lo.z)*factor+.17))
  o.matrix_world.identity()
  if 'canvas' in o.name.lower():
   o.data.materials.clear();o.data.materials.append(glass);o.name='New silvered glass, no image or face'
  else:o.name='CC0 carved frame 02 · new mirror surround'
 for sign in [-1,1]:
  box('Mirror support foot',(sign*.62,.015,.05),(.48,.62,.10),wood,.035)
 box('Mirror plinth',(0,0,.14),(2.2,.36,.17),edgewood,.025)
 for x in [-.82,.82]:
  cyl('Mirror side mounting pin',(x,.06,.23),.055,.16,brass,(0,math.pi/2,0))

def celestial():
 cyl('Cotton circular chart',(0,0,.025),1.65,.035,paper)
 for r in [.35,.6,.85,1.1,1.38,1.55]:ring('Celestial coordinate ring',(0,0,.049),r,.0028,blue)
 for i in range(24):
  a=i*math.tau/24;tube('Radial coordinate',[(.16*math.cos(a),.16*math.sin(a),.05),(1.52*math.cos(a),1.52*math.sin(a),.05)],.0018,blue)
 random.seed(1890)
 for i in range(55):
  a=random.random()*math.tau;r=math.sqrt(random.random())*1.4;cyl('Chart star',(r*math.cos(a),r*math.sin(a),.052),.012 if i%8 else .025,.005,blue)
 ring('Chart brass outer rim',(0,0,.015),1.67,.013,darkbrass)
 # Separate ornamental sandglass stand; animated glass/sand stays procedural.
 for x in [-.4,.4]:
  for y in [-.4,.4]:
   cyl('Turned hourglass column',(2+x,y,.62),.027,1.15,brass)
   for z in [.17,.31,.99,1.13]:cyl('Column collar',(2+x,y,z),.05,.03,darkbrass)
 for z in [.04,1.23]:
  cyl('Hourglass foot',(2,0,z),.62,.09,wood)
  ring('Hourglass rim',(2,0,z+.055),.57,.014,brass)

def drawer():
 box('Shallow archive bottom',(0,0,.065),(2.8,1.9,.10),wood)
 for x in [-1.38,1.38]:box('Drawer side',(x,0,.28),(.085,1.9,.40),edgewood)
 for y in [-.92,.92]:box('Drawer rail',(0,y,.28),(2.8,.10,.40),wood)
 box('Inset front field',(0,-.99,.28),(2.42,.035,.25),edgewood,.009)
 for x in [-1.17,1.17]:box('Front inlay',(x,-1.01,.28),(.018,.012,.24),brass,.002)
 tube('Brass pull',[(-.20,-1.07,.34),(-.20,-1.16,.26),(0,-1.18,.23),(.20,-1.16,.26),(.20,-1.07,.34)],.023,brass)
 for x in [-.20,.20]:sphere('Pull mount',(x,-1.035,.34),(.045,.023,.045),brass)
 box('Document compartment',(-.10,0,.19),(.035,1.7,.24),edgewood,.01)
 for i in range(6):
  o=box('Archive cotton letter',(-.71+.03*i,.10+.015*i,.127+i*.012),(1.14,1.37,.012),paper,.003);o.rotation_euler[2]=-.08+i*.018
 for i in range(3):
  o=box('Blank photographic card',(.68,-.04,.13+i*.018),(.91,1.15,.018),cloth,.005);o.rotation_euler[2]=.08+i*.05
  box('Photo corner',(.32,-.55,.2),(.12,.12,.018),paper,.005)

for chapter,fn,title in [('I',envelope,'Folded cotton envelope and wax'),('II',album,'Leather photo album and spine'),('III',memory,'Ink and suspended paper'),('IV',window,'Leaded Victorian window'),('V',mirror,'Sculpted oval Victorian mirror'),('VI',celestial,'Circular celestial chart and sandglass stand'),('VII',drawer,'Shallow walnut document drawer')]:
 if chapter not in args.chapters: continue
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 fn()
 # Merge static pieces by material to keep draw calls below the practical budget.
 for mat in list(bpy.data.materials):
  obs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
  if len(obs)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in obs:o.select_set(True)
  bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join()
 bpy.ops.object.select_all(action='SELECT')
 path=OUT/f'chapter-{chapter.lower()}.glb'
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_tangents=chapter=="V")
 data=path.read_bytes();tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
 manifest.append({'id':f'chapter-{chapter.lower()}','chapter':chapter,'title':title,'authors':['Carta para Hogwarts · original scripted modeling'],'license':'CC0-1.0','source':'scripts/redesign/model-chapters.py','path':'/assets/redesign/'+path.name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'triangles':tri})
 print(chapter,len(data),tri)
for entry in manifest:
 if entry['chapter']=='V':
  entry['authors']=['Rob Tuytel','Rico Cilliers','Carta para Hogwarts · mirror conversion and modeled plinth']
  entry['derivedFrom']='https://polyhaven.com/a/fancy_picture_frame_02'
  entry['licenseUrl']='https://polyhaven.com/license'
path=ROOT/'src/content/redesign-assets.json'
existing=json.loads(path.read_text()) if path.exists() else []
merged=[e for e in existing if e['chapter'] not in args.chapters]+manifest
merged.sort(key=lambda e:['I','II','III','IV','V','VI','VII'].index(e['chapter']))
path.write_text(json.dumps(merged,indent=2)+'\n')
