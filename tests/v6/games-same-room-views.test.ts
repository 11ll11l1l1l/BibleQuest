import { describe, expect, it } from 'vitest';
import { renderSameRoomCompleteView, renderSameRoomQuestionView, renderSameRoomSetupView } from '../../src/features/games/views/same-room.js';

const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]??char));

describe('same-room game views',()=>{
  it('keeps setup player-count actions and launcher escape',()=>{
    const html=renderSameRoomSetupView();
    for(const count of [2,3,4,5,6]) expect(html).toContain(`data-same-room-start="${count}"`);
    expect(html).toContain('data-game-launcher');
  });

  it('renders deterministic active-player, scoreboard and answer hooks',()=>{
    const html=renderSameRoomQuestionView({
      escapeHtml,
      gameSource:'<small data-source>source</small>',
      state:{
        index:0,total:2,score:0,gained:0,locked:false,selected:null,correct:false,
        currentPlayer:{id:'p1',name:'Player <1>'},
        players:[{id:'p1',name:'Player <1>',score:2,active:true},{id:'p2',name:'Player 2',score:1,active:false}],
        question:{id:'q1',q:'Question?',choices:['A <choice>','B'],answer:0,why:'Why',ref:'John 1:1'}
      }
    });
    expect(html).toContain('data-same-room-question="q1"');
    expect(html).toContain('Turn: <b>Player &lt;1&gt;</b>');
    expect(html).toContain('data-same-room-player="p1"');
    expect(html).toContain('data-same-room-answer="0"');
    expect(html).not.toContain('data-same-room-next');
    expect(html).toContain('<small data-source>source</small>');
  });

  it('locks choices and exposes feedback only after an answer',()=>{
    const html=renderSameRoomQuestionView({
      escapeHtml,gameSource:'',
      state:{
        index:1,total:2,locked:true,selected:1,correct:false,
        currentPlayer:{id:'p2',name:'Player 2'},
        players:[{id:'p1',name:'Player 1',score:1,active:false},{id:'p2',name:'Player 2',score:0,active:true}],
        question:{id:'q2',q:'Question?',choices:['Right','Wrong'],answer:0,why:'Review <this>',ref:'Luke 1:1'}
      }
    });
    expect(html).toContain('data-same-room-feedback');
    expect(html).toContain('Review &lt;this&gt;');
    expect(html).toContain('See final scoreboard');
    expect(html).toContain('data-same-room-answer="1" disabled');
  });

  it('renders winner and tie results without changing local score identity',()=>{
    const winner=renderSameRoomCompleteView({escapeHtml,state:{players:[{id:'p1',name:'One',score:3},{id:'p2',name:'Two',score:1}]}});
    expect(winner).toContain('<h1>Winner: One</h1>');
    expect(winner).toContain('data-same-room-open');
    const tie=renderSameRoomCompleteView({escapeHtml,state:{players:[{id:'p1',name:'One',score:2},{id:'p2',name:'Two',score:2}]}});
    expect(tie).toContain('<h1>Tie: One &amp; Two</h1>');
  });
});
