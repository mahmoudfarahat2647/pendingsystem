import { diff, patch, unpatch, clone } from 'jsondiffpatch';

const state1 = { val: "A" };
const state2 = { val: "B" };
const state3 = { val: "C" };

let undoStack: any[] = [];
let redoStack: any[] = [];
let lastSavedState: any = null;

function pushUndo(currentSnapshot) {
    if (!lastSavedState) {
        lastSavedState = clone(currentSnapshot);
        undoStack = [];
        return;
    }

    const diffPatch = diff(currentSnapshot, lastSavedState);
    if (!diffPatch) return;

    undoStack.push(diffPatch);
    redoStack = [];
    lastSavedState = clone(currentSnapshot);
}

function undo(currentSnapshot) {
    if (!lastSavedState) return null;

    const redoPatch = diff(lastSavedState, currentSnapshot);
    if (undoStack.length === 0 && !redoPatch) return currentSnapshot;

    const appState = clone(lastSavedState);

    let newLastSavedState = clone(appState);
    let newUndoStack = [...undoStack];

    if (newUndoStack.length > 0) {
        const lastPatch = newUndoStack.pop();
        newLastSavedState = patch(clone(appState), lastPatch);
    }

    if (redoPatch) {
        redoStack.push(redoPatch);
    }

    undoStack = newUndoStack;
    lastSavedState = newLastSavedState;

    return appState;
}

function redo(currentSnapshot) {
    if (redoStack.length === 0 || !lastSavedState) return null;

    const newRedoStack = [...redoStack];
    const forwardPatch = newRedoStack.pop();
    if (!forwardPatch) return null;

    const nextState = patch(clone(currentSnapshot), forwardPatch);

    // FIX: The undo patch needs to go from nextState to currentSnapshot
    // Wait, lastSavedState is currently the state PREVIOUS to currentSnapshot (if we just undid)
    // Actually, in our undo logic:
    // Undoing from C to B: appState = B, lastSavedState = A.
    // Redo from B to C: nextState = C.
    // The undoPatch we want to push to undoStack is diff(C, B).
    // Is lastSavedState equal to B? No! lastSavedState is A!
    // Why? Because we undid to B, so `lastSavedState` was updated to A.
    // Wait, if lastSavedState is A, and we compute diff(C, A), we are skipping B!
    // Yes! That's the bug.

    // So the undo patch should be:
    const undoPatch = diff(nextState, currentSnapshot); // diff from C back to B

    if (undoPatch) {
        undoStack.push(undoPatch);
    }

    // And lastSavedState should become currentSnapshot (B) before we go to C?
    // Wait. If current state becomes C, what should lastSavedState be?
    // When we are at state C, `lastSavedState` is supposed to be the state we undo to (which is B).
    // But wait! If we are at C, and user clicks undo, we want to go back to B.
    // `lastSavedState` is what we restore!
    // So `lastSavedState` MUST be B! But B is `currentSnapshot` before redo!
    // So `lastSavedState` becomes `currentSnapshot`!

    redoStack = newRedoStack;
    lastSavedState = clone(currentSnapshot);

    return nextState;
}

pushUndo(state1); // Save A
console.log("lastSavedState:", lastSavedState, "undoStack:", undoStack.length);
pushUndo(state2); // Save B
console.log("lastSavedState:", lastSavedState, "undoStack:", undoStack.length);

let appState = undo(state3); // Undoes from C to B
console.log("Undone C->B:", appState, "lastSavedState:", lastSavedState, "undoStack:", undoStack.length, "redoStack:", redoStack.length);

appState = undo(appState); // Undoes from B to A
console.log("Undone B->A:", appState, "lastSavedState:", lastSavedState, "undoStack:", undoStack.length, "redoStack:", redoStack.length);

// Now redo A -> B
appState = redo(appState); // Redoes to B
console.log("Redone A->B:", appState, "lastSavedState:", lastSavedState, "undoStack:", undoStack.length, "redoStack:", redoStack.length);

// And redo B -> C
appState = redo(appState); // Redoes to C
console.log("Redone B->C:", appState, "lastSavedState:", lastSavedState, "undoStack:", undoStack.length, "redoStack:", redoStack.length);

// Undoes from C to B again
appState = undo(appState);
console.log("Undone C->B again:", appState, "lastSavedState:", lastSavedState, "undoStack:", undoStack.length, "redoStack:", redoStack.length);
