import test from 'node:test';
import assert from 'node:assert/strict';
import { splitBlock } from '../src/logic.js';
test('exact placement and small offsets snap without losing width', () => {
  assert.deepEqual(splitBlock(.05,0,3), {perfect:true,center:0,size:3,cut:0});
});
test('both directions conserve width and produce adjacent fragments', () => {
  for (const center of [-2,2]) {
    const r=splitBlock(center,0,10);
    assert.equal(r.size+r.cut,10); assert.equal(r.center,center/2);
    assert.equal(Math.abs(r.cutCenter-r.center),(r.size+r.cut)/2);
  }
});
test('no overlap loses, including exact edge contact', () => {
  assert.equal(splitBlock(3,0,3).miss,true); assert.equal(splitBlock(-4,0,3).miss,true);
});
