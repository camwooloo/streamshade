import React from 'react';
import { registerRoot, Composition, AbsoluteFill, Sequence, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont } from '@remotion/fonts';

loadFont({ family: 'Manrope', url: staticFile('manrope.woff2'), weight: '600' });
loadFont({ family: 'DM Mono', url: staticFile('mono.woff2'), weight: '400' });
const mint = '#b9f6cf';
const muted = '#a0b4a9';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const easing = x => 1 - Math.pow(1 - x, 3);
const enter = (frame, delay = 0) => easing(interpolate(frame - delay, [0, 24], [0, 1], clamp));
const mono = { fontFamily: 'DM Mono', fontSize: 18, letterSpacing: 3, color: muted };

function Background() {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: '#101617', overflow: 'hidden' }}>
    {[0, 1, 2, 3].map(i => <div key={i} style={{position:'absolute',width:900+i*170,height:900+i*170,right:-180-i*75,top:-190-i*60,border:'1px solid #2a4335',borderRadius:'50%',opacity:.6,transform:`translate(${Math.sin(frame / 150 + i) * 20}px,${Math.cos(frame / 170 + i) * 16}px)`}} />)}
    <div style={{position:'absolute',right:140,top:145,color:mint,fontSize:45,opacity:.55,transform:`rotate(${frame / 8}deg)`}}>+</div>
    <div style={{position:'absolute',left:110,bottom:84,width:1700,height:1,background:'#34483b'}} />
    <div style={{position:'absolute',left:110,bottom:45,...mono,fontSize:13,letterSpacing:2}}>STREAMSHADE · YOUR TWITCH COMPANION</div>
    <div style={{position:'absolute',left:110,bottom:84,width:1700*(frame/899),height:2,background:mint}} />
  </AbsoluteFill>;
}
function Brand({large = false}) {
  return <div style={{display:'flex',alignItems:'center',gap:large?22:15,fontSize:large?62:35,letterSpacing:-1.5,fontWeight:600}}><Img src={staticFile('mark.svg')} style={{width:large?86:53,height:large?86:53}}/><span>streamshade<span style={{color:mint}}>.</span></span></div>;
}
function Scene({duration, children}) {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity:interpolate(frame,[0,12,duration-12,duration-1],[0,1,1,0],clamp)}}>{children}</AbsoluteFill>;
}
function Text({children, delay = 0, style={}}) {
  const f = useCurrentFrame(); const p=enter(f,delay);
  return <div style={{opacity:p,transform:`translateY(${(1-p)*35}px)`,...style}}>{children}</div>;
}
function Picture({src, width, left, top, tilt=0, delay=8}) {
  const f=useCurrentFrame();const {fps}=useVideoConfig();
  const p=spring({frame:f-delay,fps,config:{damping:200,stiffness:110}});
  return <div style={{position:'absolute',width,left,top,padding:12,border:'1px solid #63846b',borderRadius:20,background:'#1c2d23',boxShadow:'0 35px 100px #0006',opacity:p,transform:`translateY(${(1-p)*60}px) rotate(${tilt*(1-p*.45)}deg) scale(${.97+p*.03})`}}><Img src={staticFile(src)} style={{display:'block',width:'100%',borderRadius:10}}/></div>;
}
function Intro() {
  return <Scene duration={135}>
    <div style={{position:'absolute',left:110,top:76}}><Brand /></div>
    <div style={{position:'absolute',left:110,top:310}}>
      <Text style={mono}>MAKE YOURSELF AT HOME ON TWITCH</Text>
      <Text delay={7} style={{fontSize:126,letterSpacing:-6,lineHeight:1.06,marginTop:35}}>A little less noise.</Text>
      <Text delay={20} style={{fontSize:126,letterSpacing:-6,lineHeight:1.06,color:mint}}>A lot more live.</Text>
      <Text delay={36} style={{fontSize:31,color:muted,marginTop:40}}>Stream protection. A calmer interface. Your choice.</Text>
    </div>
  </Scene>;
}
function Playback() {
  const f=useCurrentFrame();
  return <Scene duration={210}>
    <div style={{position:'absolute',left:110,top:76}}><Brand /></div>
    <div style={{position:'absolute',left:110,top:290,width:920}}>
      <Text style={mono}>01 / CHOOSE YOUR FLOW</Text>
      <Text delay={6} style={{fontSize:100,lineHeight:1.1,letterSpacing:-4,marginTop:27}}>Stay with<br/><span style={{color:mint}}>the stream.</span></Text>
      {['Smart quality — try clean replacements','Low-bandwidth — prefer a lighter stream','Mute ads — keep playback, silence ads'].map((line,i)=><Text key={line} delay={20+i*12} style={{fontSize:27,color:muted,marginTop:i===0?40:19,display:'flex',gap:17}}><span style={{color:mint}}>↗</span>{line}</Text>)}
      <Text delay={30} style={{fontSize:23,color:muted,maxWidth:780,lineHeight:1.6,marginTop:35}}>Clean streams and higher resolutions depend on Twitch.<br/>Replacement playback is not guaranteed.</Text>
    </div>
    <Picture src="popup.png" width={475} left={1280} top={155} tilt={3}/>
    <div style={{position:'absolute',left:1110,top:480,width:100,height:2,background:mint,opacity:.4+Math.sin(f/20)*.2}} />
  </Scene>;
}
function Chat() {
  return <Scene duration={180}>
    <div style={{position:'absolute',left:110,top:76}}><Brand /></div>
    <div style={{position:'absolute',left:110,top:295,width:620}}>
      <Text style={mono}>02 / MAKE ROOM FOR THE GOOD BITS</Text>
      <Text delay={5} style={{fontSize:85,lineHeight:1.09,letterSpacing:-3.8,marginTop:30}}>Your chat.<br/><span style={{color:mint}}>Your sidebar.</span></Text>
      <Text delay={18} style={{fontSize:28,color:muted,lineHeight:1.85,marginTop:33}}>Style your messages.<br/>Expand channels on hover.<br/>Hide recommendations and promotions.</Text>
    </div>
    <Picture src="chat.png" width={1040} left={795} top={215} tilt={-1.6}/>
  </Scene>;
}
function Setup() {
  return <Scene duration={210}>
    <div style={{position:'absolute',left:110,top:76}}><Brand /></div>
    <div style={{position:'absolute',left:110,top:295,width:650}}>
      <Text style={mono}>03 / A FEW LITTLE UPGRADES</Text>
      <Text delay={5} style={{fontSize:89,lineHeight:1.09,letterSpacing:-4,marginTop:30}}>Make it yours.<br/><span style={{color:mint}}>From day one.</span></Text>
      <Text delay={18} style={{fontSize:27,color:muted,lineHeight:1.85,marginTop:33}}>A guided setup for every preference.<br/>Optional bonus-point claiming.<br/>Local settings. No analytics.</Text>
    </div>
    <Picture src="setup.png" width={990} left={835} top={220} tilt={1.5}/>
  </Scene>;
}
function Outro() {
  return <Scene duration={165}>
    <AbsoluteFill style={{alignItems:'center',justifyContent:'center',paddingBottom:60}}>
      <Text><Brand large /></Text>
      <Text delay={10} style={{fontSize:97,letterSpacing:-4.5,marginTop:42,textAlign:'center',lineHeight:1.1}}>Your Twitch.<br/><span style={{color:mint}}>Your way.</span></Text>
      <Text delay={25} style={{fontSize:27,color:muted,marginTop:30}}>Explore the open-source Chrome extension.</Text>
      <Text delay={35} style={{fontFamily:'DM Mono',fontSize:28,color:mint,marginTop:33,padding:'16px 28px',border:'1px solid #527259',borderRadius:9}}>github.com/camwooloo/streamshade</Text>
    </AbsoluteFill>
  </Scene>;
}
function Promo() {
  return <AbsoluteFill style={{fontFamily:'Manrope',color:'#edf3ee',fontWeight:600}}>
    <Background/>
    <Sequence from={0} durationInFrames={135} premountFor={30}><Intro/></Sequence>
    <Sequence from={135} durationInFrames={210} premountFor={30}><Playback/></Sequence>
    <Sequence from={345} durationInFrames={180} premountFor={30}><Chat/></Sequence>
    <Sequence from={525} durationInFrames={210} premountFor={30}><Setup/></Sequence>
    <Sequence from={735} durationInFrames={165} premountFor={30}><Outro/></Sequence>
  </AbsoluteFill>;
}
registerRoot(() => <Composition id="StreamshadePromo" component={Promo} width={1920} height={1080} fps={30} durationInFrames={900}/>);
