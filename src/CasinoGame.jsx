import React, { useState, useEffect, useCallback, useRef } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardValue = (rank) => {
  if (rank === 'A') return 1;
  if (['J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
};

const isFaceCard = (rank) => ['J', 'Q', 'K'].includes(rank);

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}${suit}` });
    }
  }
  return deck;
};

const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Card = React.forwardRef(({ card, onClick, selected, small, faceDown }, ref) => {
  const isRed = card && (card.suit === '♥' || card.suit === '♦');
  
  if (faceDown) {
    return (
      <div ref={ref} className={`${small ? 'w-8 h-11' : 'w-12 h-16'} bg-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center flex-shrink-0`}>
        <div className="text-blue-600 text-xs">♠♥</div>
      </div>
    );
  }
  
  if (!card) return null;
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`${small ? 'w-10 h-14 text-sm' : 'w-12 h-16 text-base'} bg-white rounded-lg border-2 flex-shrink-0
        ${selected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-300'} 
        ${onClick ? 'cursor-pointer hover:border-blue-400' : ''} 
        flex flex-col items-center justify-center font-bold shadow-md
        ${isRed ? 'text-red-600' : 'text-black'}`}
    >
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
});

const Deck = ({ count, small }) => {
  if (count === 0) return null;
  
  const stackCount = Math.min(Math.ceil(count / 10), 5);
  
  return (
    <div className="relative" style={{ width: small ? 32 : 48, height: small ? 44 : 64 }}>
      {Array(stackCount).fill(0).map((_, i) => (
        <div 
          key={i}
          className={`absolute ${small ? 'w-8 h-11' : 'w-12 h-16'} bg-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center`}
          style={{ top: -i * 2, left: -i * 1 }}
        >
          {i === stackCount - 1 && (
            <div className="text-blue-400 text-xs font-bold">{count}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const FlyingCard = ({ startPos, endPos }) => {
  const [position, setPosition] = useState(startPos);
  
  useEffect(() => {
    // Start animation after a brief delay
    const timeout = setTimeout(() => {
      setPosition(endPos);
    }, 50);
    
    // Call onComplete after animation finishes
    const completeTimeout = setTimeout(() => {
      if (window._onCardArrived) {
        window._onCardArrived();
      }
    }, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(completeTimeout);
    };
  }, [endPos]);
  
  return (
    <div 
      className="fixed w-10 h-14 bg-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center z-50 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transition: 'left 0.45s ease-out, top 0.45s ease-out',
      }}
    >
      <div className="text-blue-600 text-xs">♠♥</div>
    </div>
  );
};

const AnimatedCard = ({ card, startPos, endPos, onComplete, delay = 0 }) => {
  const [position, setPosition] = useState(startPos);
  const isRed = card && (card.suit === '♥' || card.suit === '♦');
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setPosition(endPos);
    }, 50 + delay);
    
    const completeTimeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 450 + delay);
    
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(completeTimeout);
    };
  }, [endPos, delay, onComplete]);
  
  return (
    <div 
      className={`fixed w-10 h-14 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center z-50 shadow-lg font-bold text-sm ${isRed ? 'text-red-600' : 'text-black'}`}
      style={{
        left: position.x,
        top: position.y,
        transition: 'left 0.4s ease-out, top 0.4s ease-out',
      }}
    >
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
};

const Build = React.forwardRef(({ build, onClick, selected }, ref) => {
  const displayValue = build.isFaceCard ? build.faceRank : build.value;
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`relative w-14 h-18 cursor-pointer ${selected ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
    >
      <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-10 font-bold">
        {displayValue}
      </div>
      <div className="relative">
        {build.cards.slice(0, 3).map((card, i) => (
          <div key={card.id} className="absolute" style={{ top: i * 3, left: i * 3 }}>
            <Card card={card} small />
          </div>
        ))}
        {build.cards.length > 3 && (
          <div className="absolute top-12 left-0 text-xs text-gray-600">+{build.cards.length - 3}</div>
        )}
      </div>
    </div>
  );
});

const PlayerHand = React.forwardRef(({ player, position, isCurrentPlayer, cardCount, message, isDealer, deckCount, visualDeckCount, isDealing, isReceivingCards, deckRef, revealedCard }, ref) => {
  const positionClasses = {
    top: 'absolute top-0 left-1/2 -translate-x-1/2',
    left: 'absolute left-0 top-1/2 -translate-y-1/2',
    right: 'absolute right-0 top-1/2 -translate-y-1/2',
  };
  
  const cardContainerClasses = {
    top: 'flex-row',
    left: 'flex-col',
    right: 'flex-col',
  };
  
  const displayDeckCount = isDealing ? visualDeckCount : deckCount;
  
  // Calculate how many face-down cards to show (excluding revealed card)
  const faceDownCount = revealedCard ? cardCount - 1 : cardCount;

  return (
    <div ref={ref} className={`${positionClasses[position]} ${isCurrentPlayer ? 'bg-green-600' : 'bg-green-700/80'} p-2 rounded-lg ${isReceivingCards ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-center justify-center gap-2">
        <div className="text-white text-xs text-center">{player.name}</div>
        {isDealer && <div className="text-yellow-300 text-xs">(D)</div>}
      </div>
      <div className="text-white text-xs mb-1 text-center opacity-75">{player.captured.length} capt</div>
      <div className={`flex ${cardContainerClasses[position]} gap-1 justify-center items-center`}>
        {isDealer && displayDeckCount > 0 && (
          <div className="mr-1" ref={deckRef}>
            <Deck count={displayDeckCount} small />
          </div>
        )}
        {Array(Math.max(0, faceDownCount)).fill(0).map((_, j) => (
          <Card key={j} faceDown small />
        ))}
        {revealedCard && (
          <div className="ring-2 ring-yellow-400 rounded-lg">
            <Card card={revealedCard} small />
          </div>
        )}
      </div>
      {message && (
        <div className="mt-2 bg-white text-gray-800 text-xs px-2 py-1 rounded-lg shadow-md whitespace-nowrap text-center">
          {message}
        </div>
      )}
    </div>
  );
});

export default function CasinoGame() {
  const [gameState, setGameState] = useState('setup');
  const [deck, setDeck] = useState([]);
  const [players, setPlayers] = useState([
    { name: 'You', hand: [], captured: [], sweeps: 0, isHuman: true },
    { name: 'AI 1', hand: [], captured: [], sweeps: 0, isHuman: false },
    { name: 'AI 2', hand: [], captured: [], sweeps: 0, isHuman: false },
    { name: 'AI 3', hand: [], captured: [], sweeps: 0, isHuman: false },
  ]);
  const [table, setTable] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [selectedHandCard, setSelectedHandCard] = useState(null);
  const [selectedTableCards, setSelectedTableCards] = useState([]);
  const [selectedBuilds, setSelectedBuilds] = useState([]);
  const [lastCapturer, setLastCapturer] = useState(null);
  const [isLastDeal, setIsLastDeal] = useState(false);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(null);
  const [roundScores, setRoundScores] = useState([0, 0, 0, 0]);
  const [targetScore] = useState(21);
  const [buildMode, setBuildMode] = useState(false);
  const [buildValue, setBuildValue] = useState(null);
  const [dealer, setDealer] = useState(0);
  const [firstPlayer, setFirstPlayer] = useState(1);
  const [playerMessages, setPlayerMessages] = useState(['', '', '', '']);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingTo, setDealingTo] = useState(null); // 'player0', 'player1', 'player2', 'player3', 'table'
  const [flyingCard, setFlyingCard] = useState(null); // { startPos, endPos, key }
  const [visualDeckCount, setVisualDeckCount] = useState(52);
  
  // AI animation states
  const [aiRevealedCard, setAiRevealedCard] = useState(null); // { playerIndex, card }
  const [aiAnimatingCards, setAiAnimatingCards] = useState([]); // [{ card, startPos, endPos, key }]
  const [aiActionPending, setAiActionPending] = useState(null); // stored action to execute after animation
  
  // Refs for position tracking
  const deckRef = useRef(null);
  const playerRefs = useRef([null, null, null, null]);
  const tableRef = useRef(null);
  const tableCardRefs = useRef({});
  const buildRefs = useRef({});

  const getElementCenter = (element) => {
    if (!element) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - 20, y: rect.top + rect.height / 2 - 28 };
  };

  const animateDeal = useCallback((deckCards, targetPlayers, targetTable, isInitial, newDealer, roundFirstPlayer) => {
    setIsDealing(true);
    setVisualDeckCount(deckCards.length);
    const dealSequence = [];
    let deckIndex = deckCards.length - 1;
    
    // Deal order: 2 cards to each player (starting left of dealer), then 2 to table, repeat
    const playerOrder = [(newDealer + 1) % 4, (newDealer + 2) % 4, (newDealer + 3) % 4, newDealer];
    
    for (let round = 0; round < 2; round++) {
      // Deal 2 cards to each player (one at a time for animation)
      for (const playerIdx of playerOrder) {
        for (let c = 0; c < 2; c++) {
          dealSequence.push({ type: 'player', player: playerIdx, card: deckCards[deckIndex], deckRemaining: deckIndex });
          deckIndex -= 1;
        }
      }
      // Deal 2 cards to table (only on initial deal)
      if (isInitial) {
        for (let c = 0; c < 2; c++) {
          dealSequence.push({ type: 'table', card: deckCards[deckIndex], deckRemaining: deckIndex });
          deckIndex -= 1;
        }
      }
    }
    
    const remainingDeck = deckCards.slice(0, deckIndex + 1);
    
    let stepIndex = 0;
    const newPlayers = targetPlayers.map(p => ({ ...p, hand: [...p.hand] }));
    let newTable = isInitial ? [] : [...targetTable];
    
    // Clear hands for new deal
    newPlayers.forEach(p => p.hand = []);
    
    const dealNextCard = () => {
      if (stepIndex >= dealSequence.length) {
        setIsDealing(false);
        setDealingTo(null);
        setFlyingCard(null);
        setDeck(remainingDeck);
        setVisualDeckCount(remainingDeck.length);
        setPlayers(newPlayers);
        setTable(newTable);
        setIsLastDeal(remainingDeck.length === 0);
        setCurrentPlayer(roundFirstPlayer);
        setPlayerMessages(['', '', '', '']);
        if (remainingDeck.length === 0) {
          setMessage('Last deal!');
        } else {
          setMessage(roundFirstPlayer === 0 ? 'Your turn' : '');
        }
        return;
      }
      
      const step = dealSequence[stepIndex];
      const startPos = getElementCenter(deckRef.current);
      let endPos;
      
      // Update visual deck count
      setVisualDeckCount(step.deckRemaining);
      
      if (step.type === 'player') {
        setDealingTo(`player${step.player}`);
        endPos = getElementCenter(playerRefs.current[step.player]);
      } else {
        setDealingTo('table');
        endPos = getElementCenter(tableRef.current);
      }
      
      // Start flying card animation
      setFlyingCard({
        startPos,
        endPos,
        key: `${stepIndex}-${Date.now()}`
      });
    };
    
    const onCardArrived = () => {
      const step = dealSequence[stepIndex];
      
      if (step.type === 'player') {
        newPlayers[step.player].hand.push(step.card);
        setPlayers([...newPlayers]);
      } else {
        newTable.push(step.card);
        setTable([...newTable]);
      }
      
      setFlyingCard(null);
      stepIndex++;
      
      // Small delay before next card
      setTimeout(dealNextCard, 100);
    };
    
    // Store callback for flying card completion
    window._onCardArrived = onCardArrived;
    
    // Start dealing
    setTimeout(dealNextCard, 300);
  }, []);

  const startGame = useCallback((newDealer = dealer) => {
    const shuffled = shuffleDeck(createDeck());
    
    setDeck(shuffled);
    setVisualDeckCount(52);
    setPlayers(players.map(p => ({ ...p, hand: [], captured: [], sweeps: 0 })));
    setTable([]);
    setBuilds([]);
    setDealer(newDealer);
    const roundFirstPlayer = (newDealer + 1) % 4;
    setFirstPlayer(roundFirstPlayer);
    setCurrentPlayer(roundFirstPlayer);
    setLastCapturer(null);
    setIsLastDeal(false);
    setSelectedHandCard(null);
    setSelectedTableCards([]);
    setSelectedBuilds([]);
    setGameState('playing');
    setMessage('');
    setBuildMode(false);
    setBuildValue(null);
    setPlayerMessages(['', '', '', '']);
    
    // Start dealing animation
    animateDeal(
      shuffled,
      players.map(p => ({ ...p, hand: [], captured: [], sweeps: 0 })),
      [],
      true,
      newDealer,
      roundFirstPlayer
    );
  }, [players, dealer, animateDeal]);

  const isValidCapture = (handCard, selectedTable, selectedBlds) => {
    const cardValue = getCardValue(handCard.rank);
    
    // Face card capture
    if (cardValue === 0) {
      if (selectedBlds.length > 0) {
        const allFaceBuilds = selectedBlds.every(b => b.isFaceCard && b.faceRank === handCard.rank);
        if (!allFaceBuilds) return false;
      }
      const allMatchingFace = selectedTable.every(tc => tc.rank === handCard.rank);
      return (selectedTable.length > 0 || selectedBlds.length > 0) && 
             (selectedTable.length === 0 || allMatchingFace);
    }

    for (const build of selectedBlds) {
      if (build.value !== cardValue) return false;
    }

    if (selectedTable.length === 0) return selectedBlds.length > 0;

    const selectedValues = selectedTable.map(tc => getCardValue(tc.rank));
    
    if (selectedTable.length === 1) {
      return selectedValues[0] === cardValue;
    }

    const sum = selectedValues.reduce((a, b) => a + b, 0);
    if (sum === cardValue) return true;

    const groups = [];
    const findGroups = (cards, target, current = [], start = 0) => {
      const sum = current.reduce((s, c) => s + getCardValue(c.rank), 0);
      if (sum === target && current.length >= 1) {
        groups.push([...current]);
        return;
      }
      if (sum > target) return;
      
      for (let i = start; i < cards.length; i++) {
        findGroups(cards, target, [...current, cards[i]], i + 1);
      }
    };
    
    findGroups(selectedTable, cardValue);
    
    const usedCards = new Set();
    for (const group of groups) {
      group.forEach(c => usedCards.add(c.id));
    }
    
    return usedCards.size === selectedTable.length;
  };

  const executeCapture = () => {
    if (!selectedHandCard) return;
    
    const newPlayers = [...players];
    const player = { ...newPlayers[currentPlayer] };
    const capturedCards = [selectedHandCard, ...selectedTableCards];
    
    for (const build of selectedBuilds) {
      capturedCards.push(...build.cards);
    }
    
    player.captured = [...player.captured, ...capturedCards];
    player.hand = player.hand.filter(c => c.id !== selectedHandCard.id);
    
    const newTable = table.filter(c => !selectedTableCards.some(sc => sc.id === c.id));
    const newBuilds = builds.filter(b => !selectedBuilds.some(sb => sb.id === b.id));
    
    const cardValue = getCardValue(selectedHandCard.rank);
    const displayValue = cardValue === 0 ? selectedHandCard.rank + 's' : cardValue + 's';
    
    let msg = `Taking ${displayValue}`;
    if (newTable.length === 0 && newBuilds.length === 0) {
      player.sweeps += 1;
      msg = 'Sweep!';
    }
    
    const newMessages = [...playerMessages];
    newMessages[currentPlayer] = msg;
    setPlayerMessages(newMessages);
    
    newPlayers[currentPlayer] = player;
    setPlayers(newPlayers);
    setTable(newTable);
    setBuilds(newBuilds);
    setLastCapturer(currentPlayer);
    setSelectedHandCard(null);
    setSelectedTableCards([]);
    setSelectedBuilds([]);
    setMessage(msg);
    
    nextTurn(newPlayers, newTable, newBuilds);
  };

  const executeBuild = () => {
    if (!selectedHandCard) return;
    
    const newPlayers = [...players];
    const player = { ...newPlayers[currentPlayer] };
    const isFace = isFaceCard(selectedHandCard.rank);
    
    if (isFace) {
      // Face card build - must have table cards selected
      if (selectedTableCards.length === 0) {
        setMessage('Select matching face cards on table');
        return;
      }
      const hasCapturingCard = player.hand.some(c => c.id !== selectedHandCard.id && c.rank === selectedHandCard.rank);
      if (!hasCapturingCard) {
        setMessage('Need another ' + selectedHandCard.rank + ' to capture!');
        return;
      }
      if (!selectedTableCards.every(tc => tc.rank === selectedHandCard.rank)) {
        setMessage('Face builds must be same rank!');
        return;
      }
      
      const buildCards = [selectedHandCard, ...selectedTableCards];
      const newBuild = {
        id: `build-${Date.now()}`,
        cards: buildCards,
        value: 0,
        isFaceCard: true,
        faceRank: selectedHandCard.rank,
        owner: currentPlayer
      };
      
      player.hand = player.hand.filter(c => c.id !== selectedHandCard.id);
      newPlayers[currentPlayer] = player;
      
      const newTable = table.filter(c => !selectedTableCards.some(sc => sc.id === c.id));
      const newBuilds = [...builds, newBuild];
      
      const msg = `Building ${selectedHandCard.rank}s`;
      const newMessages = [...playerMessages];
      newMessages[currentPlayer] = msg;
      setPlayerMessages(newMessages);
      
      setPlayers(newPlayers);
      setTable(newTable);
      setBuilds(newBuilds);
      setSelectedHandCard(null);
      setSelectedTableCards([]);
      setSelectedBuilds([]);
      setBuildMode(false);
      setBuildValue(null);
      setMessage(msg);
      
      nextTurn(newPlayers, newTable, newBuilds);
    } else {
      // Numeric build
      if (!buildValue) return;
      
      const hasCapturingCard = player.hand.some(c => c.id !== selectedHandCard.id && getCardValue(c.rank) === buildValue);
      if (!hasCapturingCard) {
        setMessage('Need a card in hand to capture this build!');
        return;
      }
      
      const handCardValue = getCardValue(selectedHandCard.rank);
      const tableSum = selectedTableCards.reduce((sum, c) => sum + getCardValue(c.rank), 0);
      const buildsSum = selectedBuilds.reduce((sum, b) => sum + b.value, 0);
      
      if (handCardValue + tableSum + buildsSum !== buildValue) {
        setMessage('Cards must add up to build value!');
        return;
      }
      
      // Gather all cards for the new build
      const buildCards = [selectedHandCard, ...selectedTableCards];
      for (const b of selectedBuilds) {
        buildCards.push(...b.cards);
      }
      
      const newBuild = {
        id: `build-${Date.now()}`,
        cards: buildCards,
        value: buildValue,
        isFaceCard: false,
        owner: currentPlayer
      };
      
      player.hand = player.hand.filter(c => c.id !== selectedHandCard.id);
      newPlayers[currentPlayer] = player;
      
      const newTable = table.filter(c => !selectedTableCards.some(sc => sc.id === c.id));
      const newBuilds = builds.filter(b => !selectedBuilds.some(sb => sb.id === b.id));
      newBuilds.push(newBuild);
      
      const msg = `Building ${buildValue}s`;
      const newMessages = [...playerMessages];
      newMessages[currentPlayer] = msg;
      setPlayerMessages(newMessages);
      
      setPlayers(newPlayers);
      setTable(newTable);
      setBuilds(newBuilds);
      setSelectedHandCard(null);
      setSelectedTableCards([]);
      setSelectedBuilds([]);
      setBuildMode(false);
      setBuildValue(null);
      setMessage(msg);
      
      nextTurn(newPlayers, newTable, newBuilds);
    }
  };

  const executeTrail = () => {
    if (!selectedHandCard) return;
    
    const playerBuilds = builds.filter(b => b.owner === currentPlayer);
    if (playerBuilds.length > 0) {
      setMessage("Can't trail with a build on table!");
      return;
    }
    
    const newPlayers = [...players];
    const player = { ...newPlayers[currentPlayer] };
    player.hand = player.hand.filter(c => c.id !== selectedHandCard.id);
    newPlayers[currentPlayer] = player;
    
    const newTable = [...table, selectedHandCard];
    
    const cardDisplay = selectedHandCard.rank === '10' ? '10' : selectedHandCard.rank;
    const msg = `Trailing ${cardDisplay}`;
    const newMessages = [...playerMessages];
    newMessages[currentPlayer] = msg;
    setPlayerMessages(newMessages);
    
    setPlayers(newPlayers);
    setTable(newTable);
    setSelectedHandCard(null);
    setSelectedTableCards([]);
    setMessage(msg);
    
    nextTurn(newPlayers, newTable, builds);
  };

  const nextTurn = useCallback((currentPlayers, currentTable, currentBuilds) => {
    const allHandsEmpty = currentPlayers.every(p => p.hand.length === 0);
    
    if (allHandsEmpty) {
      if (isLastDeal) {
        endRound(currentPlayers, currentTable, currentBuilds);
        return;
      } else {
        // Deal new cards with animation (not initial, so no table cards)
        setTable(currentTable);
        setPlayers(currentPlayers);
        animateDeal(
          deck,
          currentPlayers,
          currentTable,
          false,
          dealer,
          firstPlayer
        );
        return;
      }
    }
    
    const nextP = (currentPlayer + 1) % 4;
    setCurrentPlayer(nextP);
    
    // Clear the message of the player whose turn it now is
    setPlayerMessages(prev => {
      const newMessages = [...prev];
      newMessages[nextP] = '';
      return newMessages;
    });
    
    if (nextP === 0) {
      setMessage('Your turn');
    }
  }, [currentPlayer, deck, isLastDeal, dealer, animateDeal, firstPlayer]);

  const endRound = (finalPlayers, finalTable, finalBuilds) => {
    const newPlayers = [...finalPlayers];
    
    if (lastCapturer !== null) {
      const remaining = [...finalTable];
      for (const build of finalBuilds) {
        remaining.push(...build.cards);
      }
      newPlayers[lastCapturer] = {
        ...newPlayers[lastCapturer],
        captured: [...newPlayers[lastCapturer].captured, ...remaining]
      };
    }
    
    const scores = calculateScores(newPlayers);
    setScores(scores);
    
    const newRoundScores = roundScores.map((s, i) => s + scores[i].total);
    setRoundScores(newRoundScores);
    
    // Rotate dealer for next round
    const nextDealer = (dealer + 1) % 4;
    setDealer(nextDealer);
    
    const winner = newRoundScores.findIndex(s => s >= targetScore);
    if (winner !== -1) {
      setGameState('gameOver');
    } else {
      setGameState('roundEnd');
    }
    
    setPlayers(newPlayers);
    setPlayerMessages(['', '', '', '']);
  };

  const calculateScores = (players) => {
    const scores = players.map((p, idx) => ({
      name: p.name,
      cards: p.captured.length,
      spades: p.captured.filter(c => c.suit === '♠').length,
      hasLittleCasino: p.captured.some(c => c.rank === '2' && c.suit === '♠'),
      hasBigCasino: p.captured.some(c => c.rank === '10' && c.suit === '♦'),
      aces: p.captured.filter(c => c.rank === 'A').length,
      sweeps: p.sweeps,
      total: 0
    }));

    const maxCards = Math.max(...scores.map(s => s.cards));
    const maxSpades = Math.max(...scores.map(s => s.spades));
    
    const cardsWinners = scores.filter(s => s.cards === maxCards);
    const spadesWinners = scores.filter(s => s.spades === maxSpades);

    scores.forEach(s => {
      if (cardsWinners.length === 1 && s.cards === maxCards) s.total += 3;
      if (spadesWinners.length === 1 && s.spades === maxSpades) s.total += 1;
      if (s.hasLittleCasino) s.total += 1;
      if (s.hasBigCasino) s.total += 2;
      s.total += s.aces;
      s.total += s.sweeps;
    });

    return scores;
  };

  // Execute the pending AI action after animation completes
  const executeAiAction = useCallback((action) => {
    const { type, newPlayers, newTable, newBuilds, msg, playerIndex } = action;
    
    setAiRevealedCard(null);
    setAiAnimatingCards([]);
    
    const setAiMessage = (msg) => {
      setPlayerMessages(prev => {
        const newMessages = [...prev];
        newMessages[playerIndex] = msg;
        return newMessages;
      });
    };
    
    setAiMessage(msg);
    setPlayers(newPlayers);
    setTable(newTable);
    setBuilds(newBuilds);
    
    if (type === 'capture') {
      setLastCapturer(playerIndex);
    }
    
    setMessage(`${players[playerIndex].name}: ${msg}`);
    nextTurn(newPlayers, newTable, newBuilds);
  }, [nextTurn, players]);

  // Start animation for AI move
  const animateAiMove = useCallback((action) => {
    const { type, card, capturedTableCards = [], capturedBuilds = [], targetTableCard, playerIndex } = action;
    const playerPos = getElementCenter(playerRefs.current[playerIndex]);
    const tablePos = getElementCenter(tableRef.current);
    
    // Clear the revealed card - it's now "in motion"
    setAiRevealedCard(null);
    
    if (type === 'capture') {
      // First, animate the played card from player to table
      const playedCardAnim = {
        card,
        startPos: playerPos,
        endPos: tablePos,
        key: `played-${Date.now()}`
      };
      
      setAiAnimatingCards([playedCardAnim]);
      
      // After played card reaches table, animate captured cards back to player
      setTimeout(() => {
        const captureAnims = [];
        
        // Animate table cards being captured
        capturedTableCards.forEach((tc, i) => {
          const cardRef = tableCardRefs.current[tc.id];
          const startPos = cardRef ? getElementCenter(cardRef) : tablePos;
          captureAnims.push({
            card: tc,
            startPos,
            endPos: playerPos,
            key: `capture-${tc.id}-${Date.now()}`,
            delay: i * 80
          });
        });
        
        // Animate build cards being captured
        let buildCardIndex = capturedTableCards.length;
        capturedBuilds.forEach(build => {
          const buildRef = buildRefs.current[build.id];
          const startPos = buildRef ? getElementCenter(buildRef) : tablePos;
          build.cards.forEach((bc) => {
            captureAnims.push({
              card: bc,
              startPos,
              endPos: playerPos,
              key: `capture-build-${bc.id}-${Date.now()}`,
              delay: buildCardIndex * 80
            });
            buildCardIndex++;
          });
        });
        
        if (captureAnims.length > 0) {
          setAiAnimatingCards(captureAnims);
          
          // Execute action after all animations complete
          const maxDelay = Math.max(...captureAnims.map(a => a.delay || 0));
          setTimeout(() => {
            executeAiAction(action);
          }, maxDelay + 500);
        } else {
          executeAiAction(action);
        }
      }, 450);
      
    } else if (type === 'trail') {
      // Animate card from player to table
      const trailAnim = {
        card,
        startPos: playerPos,
        endPos: tablePos,
        key: `trail-${Date.now()}`
      };
      setAiAnimatingCards([trailAnim]);
      
      setTimeout(() => {
        executeAiAction(action);
      }, 500);
      
    } else if (type === 'build') {
      // Animate card from player to table/build area
      const targetPos = targetTableCard && tableCardRefs.current[targetTableCard.id] 
        ? getElementCenter(tableCardRefs.current[targetTableCard.id])
        : tablePos;
      
      const buildAnim = {
        card,
        startPos: playerPos,
        endPos: targetPos,
        key: `build-${Date.now()}`
      };
      setAiAnimatingCards([buildAnim]);
      
      setTimeout(() => {
        executeAiAction(action);
      }, 500);
    }
  }, [executeAiAction]);

  const aiTurn = useCallback(() => {
    const player = players[currentPlayer];
    if (player.isHuman || player.hand.length === 0) return;

    // Phase 1: Determine action and reveal card
    setTimeout(() => {
      const playerBuilds = builds.filter(b => b.owner === currentPlayer);
      
      // Helper to prepare and animate action
      const prepareAction = (action) => {
        // Reveal the card first
        setAiRevealedCard({ playerIndex: currentPlayer, card: action.card });
        
        // After showing card, start animation
        setTimeout(() => {
          animateAiMove(action);
        }, 600);
      };
      
      // Check if we can capture our own build first
      for (const card of player.hand) {
        for (const build of playerBuilds) {
          const canCapture = build.isFaceCard ? 
            (card.rank === build.faceRank) : 
            (getCardValue(card.rank) === build.value);
          
          if (canCapture) {
            const capturedCards = [card, ...build.cards];
            const newPlayers = [...players];
            newPlayers[currentPlayer] = {
              ...player,
              hand: player.hand.filter(c => c.id !== card.id),
              captured: [...player.captured, ...capturedCards]
            };
            
            let newTable = [...table];
            const capturedTableCards = [];
            if (build.isFaceCard) {
              const matchingTableCards = table.filter(tc => tc.rank === card.rank);
              for (const tc of matchingTableCards) {
                newPlayers[currentPlayer].captured.push(tc);
                capturedTableCards.push(tc);
                newTable = newTable.filter(t => t.id !== tc.id);
              }
            } else {
              const matchingTableCards = table.filter(tc => getCardValue(tc.rank) === getCardValue(card.rank));
              for (const tc of matchingTableCards) {
                newPlayers[currentPlayer].captured.push(tc);
                capturedTableCards.push(tc);
                newTable = newTable.filter(t => t.id !== tc.id);
              }
            }
            
            const newBuilds = builds.filter(b => b.id !== build.id);
            
            const displayVal = build.isFaceCard ? build.faceRank + 's' : build.value + 's';
            let msg = `Taking ${displayVal}`;
            if (newTable.length === 0 && newBuilds.length === 0) {
              newPlayers[currentPlayer].sweeps += 1;
              msg = 'Sweep!';
            }
            
            prepareAction({
              type: 'capture',
              card,
              capturedTableCards,
              capturedBuilds: [build],
              newPlayers,
              newTable,
              newBuilds,
              msg,
              playerIndex: currentPlayer
            });
            return;
          }
        }
      }

      // Check for face card captures
      for (const card of player.hand) {
        const cardValue = getCardValue(card.rank);
        
        if (cardValue === 0) {
          const matching = table.filter(tc => tc.rank === card.rank);
          const matchingBuilds = builds.filter(b => b.isFaceCard && b.faceRank === card.rank && b.owner !== currentPlayer);
          
          if (matching.length > 0 || matchingBuilds.length > 0) {
            const capturedCards = [card, ...matching];
            for (const b of matchingBuilds) {
              capturedCards.push(...b.cards);
            }
            
            const newPlayers = [...players];
            newPlayers[currentPlayer] = {
              ...player,
              hand: player.hand.filter(c => c.id !== card.id),
              captured: [...player.captured, ...capturedCards]
            };
            const newTable = table.filter(tc => tc.rank !== card.rank);
            const newBuilds = builds.filter(b => !matchingBuilds.some(mb => mb.id === b.id));
            
            let msg = `Taking ${card.rank}s`;
            if (newTable.length === 0 && newBuilds.length === 0) {
              newPlayers[currentPlayer].sweeps += 1;
              msg = 'Sweep!';
            }
            
            prepareAction({
              type: 'capture',
              card,
              capturedTableCards: matching,
              capturedBuilds: matchingBuilds,
              newPlayers,
              newTable,
              newBuilds,
              msg,
              playerIndex: currentPlayer
            });
            return;
          }
          continue;
        }

        // Check for numeric captures
        const matchingBuilds = builds.filter(b => !b.isFaceCard && b.value === cardValue && b.owner !== currentPlayer);
        const matchingCards = table.filter(tc => getCardValue(tc.rank) === cardValue);
        
        let captureCards = [...matchingCards];
        let captureBuilds = [...matchingBuilds];
        
        const otherCards = table.filter(tc => getCardValue(tc.rank) !== cardValue && getCardValue(tc.rank) > 0);
        const combinations = [];
        
        const findCombos = (cards, target, current = [], start = 0) => {
          const sum = current.reduce((s, c) => s + getCardValue(c.rank), 0);
          if (sum === target && current.length > 1) {
            combinations.push([...current]);
          }
          if (sum >= target) return;
          for (let i = start; i < cards.length; i++) {
            findCombos(cards, target, [...current, cards[i]], i + 1);
          }
        };
        
        findCombos(otherCards, cardValue);
        
        if (combinations.length > 0) {
          const usedIds = new Set();
          for (const combo of combinations) {
            if (combo.every(c => !usedIds.has(c.id))) {
              captureCards.push(...combo);
              combo.forEach(c => usedIds.add(c.id));
            }
          }
        }
        
        if (captureCards.length > 0 || captureBuilds.length > 0) {
          const allCaptured = [card, ...captureCards];
          for (const b of captureBuilds) {
            allCaptured.push(...b.cards);
          }
          
          const newPlayers = [...players];
          newPlayers[currentPlayer] = {
            ...player,
            hand: player.hand.filter(c => c.id !== card.id),
            captured: [...player.captured, ...allCaptured]
          };
          
          const newTable = table.filter(tc => !captureCards.some(cc => cc.id === tc.id));
          const newBuilds = builds.filter(b => !captureBuilds.some(cb => cb.id === b.id));
          
          let msg = `Taking ${cardValue}s`;
          if (newTable.length === 0 && newBuilds.length === 0) {
            newPlayers[currentPlayer].sweeps += 1;
            msg = 'Sweep!';
          }
          
          prepareAction({
            type: 'capture',
            card,
            capturedTableCards: captureCards,
            capturedBuilds: captureBuilds,
            newPlayers,
            newTable,
            newBuilds,
            msg,
            playerIndex: currentPlayer
          });
          return;
        }
      }

      // Try to build (numeric)
      for (const card of player.hand) {
        const cardValue = getCardValue(card.rank);
        if (cardValue === 0 || cardValue > 9) continue;
        
        for (const tableCard of table) {
          const tableValue = getCardValue(tableCard.rank);
          if (tableValue === 0) continue;
          
          const buildVal = cardValue + tableValue;
          if (buildVal <= 10) {
            const hasCapture = player.hand.some(c => c.id !== card.id && getCardValue(c.rank) === buildVal);
            if (hasCapture) {
              const newBuild = {
                id: `build-${Date.now()}`,
                cards: [card, tableCard],
                value: buildVal,
                isFaceCard: false,
                owner: currentPlayer
              };
              
              const newPlayers = [...players];
              newPlayers[currentPlayer] = {
                ...player,
                hand: player.hand.filter(c => c.id !== card.id)
              };
              
              const newTable = table.filter(tc => tc.id !== tableCard.id);
              const newBuilds = [...builds, newBuild];
              
              const msg = `Building ${buildVal}s`;
              
              prepareAction({
                type: 'build',
                card,
                targetTableCard: tableCard,
                newPlayers,
                newTable,
                newBuilds,
                msg,
                playerIndex: currentPlayer
              });
              return;
            }
          }
        }
      }

      // Try to build (face card)
      for (const card of player.hand) {
        if (!isFaceCard(card.rank)) continue;
        
        const matchingTable = table.filter(tc => tc.rank === card.rank);
        if (matchingTable.length > 0) {
          const hasCapture = player.hand.filter(c => c.id !== card.id && c.rank === card.rank).length > 0;
          if (hasCapture) {
            const newBuild = {
              id: `build-${Date.now()}`,
              cards: [card, matchingTable[0]],
              value: 0,
              isFaceCard: true,
              faceRank: card.rank,
              owner: currentPlayer
            };
            
            const newPlayers = [...players];
            newPlayers[currentPlayer] = {
              ...player,
              hand: player.hand.filter(c => c.id !== card.id)
            };
            
            const newTable = table.filter(tc => tc.id !== matchingTable[0].id);
            const newBuilds = [...builds, newBuild];
            
            const msg = `Building ${card.rank}s`;
            
            prepareAction({
              type: 'build',
              card,
              targetTableCard: matchingTable[0],
              newPlayers,
              newTable,
              newBuilds,
              msg,
              playerIndex: currentPlayer
            });
            return;
          }
        }
      }

      // Trail as last resort
      if (playerBuilds.length === 0) {
        const trailCard = player.hand[0];
        const newPlayers = [...players];
        newPlayers[currentPlayer] = {
          ...player,
          hand: player.hand.filter(c => c.id !== trailCard.id)
        };
        const newTable = [...table, trailCard];
        
        const cardDisplay = trailCard.rank === '10' ? '10' : trailCard.rank;
        const msg = `Trailing ${cardDisplay}`;
        
        prepareAction({
          type: 'trail',
          card: trailCard,
          newPlayers,
          newTable,
          newBuilds: builds,
          msg,
          playerIndex: currentPlayer
        });
      } else {
        // Must capture own build
        const build = playerBuilds[0];
        for (const card of player.hand) {
          const canCapture = build.isFaceCard ? 
            (card.rank === build.faceRank) : 
            (getCardValue(card.rank) === build.value);
          
          if (canCapture) {
            const capturedCards = [card, ...build.cards];
            const newPlayers = [...players];
            newPlayers[currentPlayer] = {
              ...player,
              hand: player.hand.filter(c => c.id !== card.id),
              captured: [...player.captured, ...capturedCards]
            };
            const newBuilds = builds.filter(b => b.id !== build.id);
            
            const displayVal = build.isFaceCard ? build.faceRank + 's' : build.value + 's';
            const msg = `Taking ${displayVal}`;
            
            prepareAction({
              type: 'capture',
              card,
              capturedTableCards: [],
              capturedBuilds: [build],
              newPlayers,
              newTable: table,
              newBuilds,
              msg,
              playerIndex: currentPlayer
            });
            return;
          }
        }
      }
    }, 800);
  }, [players, currentPlayer, table, builds, animateAiMove]);

  useEffect(() => {
    if (gameState === 'playing' && currentPlayer !== 0 && !isDealing && !aiRevealedCard && aiAnimatingCards.length === 0) {
      aiTurn();
    }
  }, [currentPlayer, gameState, aiTurn, isDealing, aiRevealedCard, aiAnimatingCards]);

  const toggleTableCard = (card) => {
    if (selectedTableCards.some(c => c.id === card.id)) {
      setSelectedTableCards(selectedTableCards.filter(c => c.id !== card.id));
    } else {
      setSelectedTableCards([...selectedTableCards, card]);
    }
  };

  const toggleBuild = (build) => {
    if (selectedBuilds.some(b => b.id === build.id)) {
      setSelectedBuilds(selectedBuilds.filter(b => b.id !== build.id));
    } else {
      setSelectedBuilds([...selectedBuilds, build]);
    }
  };

  const canCapture = selectedHandCard && 
    (selectedTableCards.length > 0 || selectedBuilds.length > 0) && 
    isValidCapture(selectedHandCard, selectedTableCards, selectedBuilds);

  const canBuildFace = buildMode && selectedHandCard && isFaceCard(selectedHandCard.rank) && 
    selectedTableCards.length > 0 && 
    selectedTableCards.every(tc => tc.rank === selectedHandCard.rank) &&
    players[0].hand.some(c => c.id !== selectedHandCard.id && c.rank === selectedHandCard.rank);

  const canBuildNumeric = buildMode && selectedHandCard && !isFaceCard(selectedHandCard.rank) && 
    (selectedTableCards.length > 0 || selectedBuilds.length > 0) && buildValue && 
    players[0].hand.some(c => c.id !== selectedHandCard.id && getCardValue(c.rank) === buildValue) &&
    (getCardValue(selectedHandCard.rank) + 
     selectedTableCards.reduce((sum, c) => sum + getCardValue(c.rank), 0) +
     selectedBuilds.reduce((sum, b) => sum + b.value, 0)) === buildValue;

  const canBuild = canBuildFace || canBuildNumeric;

  const canTrail = selectedHandCard && selectedTableCards.length === 0 && selectedBuilds.length === 0 &&
    builds.filter(b => b.owner === 0).length === 0;

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-sm">
          <h1 className="text-3xl font-bold mb-4">Casino</h1>
          <p className="text-gray-600 mb-6">You vs 3 AI players</p>
          <p className="text-sm text-gray-500 mb-4">First to {targetScore} points wins!</p>
          <button
            onClick={() => startGame(0)}
            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'roundEnd' || gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">
            {gameState === 'gameOver' ? 'Game Over!' : 'Round Complete'}
          </h2>
          
          {scores && (
            <div className="space-y-3 mb-6">
              {scores.map((s, i) => (
                <div key={i} className={`p-3 rounded-lg ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-lg font-bold">+{s.total} pts</span>
                  </div>
                  <div className="text-xs text-gray-600 grid grid-cols-3 gap-1">
                    <span>Cards: {s.cards}</span>
                    <span>Spades: {s.spades}</span>
                    <span>Aces: {s.aces}</span>
                    <span>2♠: {s.hasLittleCasino ? '✓' : '✗'}</span>
                    <span>10♦: {s.hasBigCasino ? '✓' : '✗'}</span>
                    <span>Sweeps: {s.sweeps}</span>
                  </div>
                  <div className="text-sm font-medium mt-1">Total: {roundScores[i]} / {targetScore}</div>
                </div>
              ))}
            </div>
          )}

          {gameState === 'gameOver' ? (
            <div className="text-center">
              <p className="text-xl mb-4">
                {roundScores[0] >= targetScore && roundScores[0] >= Math.max(...roundScores) ? 
                  '🎉 You Win!' : `Winner: ${players[roundScores.indexOf(Math.max(...roundScores))].name}`}
              </p>
              <button
                onClick={() => {
                  setRoundScores([0, 0, 0, 0]);
                  setDealer(0);
                  startGame(0);
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                New Game
              </button>
            </div>
          ) : (
            <button
              onClick={() => startGame(dealer)}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Next Round
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-800 p-2 flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-1 px-2">
        <div className="text-white text-xs">
          {isLastDeal && <span className="bg-red-600 px-2 py-1 rounded">LAST DEAL</span>}
          {isDealing && <span className="bg-yellow-600 px-2 py-1 rounded">Dealing...</span>}
        </div>
        <div className="text-white text-xs">
          <span className={currentPlayer === 0 ? 'font-bold text-yellow-300' : ''}>You: {roundScores[0]}</span>
        </div>
      </div>

      {/* Game area with positioned players */}
      <div className="relative h-[40vh] md:h-[50vh] min-h-[280px] md:min-h-[400px] max-h-[500px]">
        {/* AI 2 - Top (across from human) */}
        <PlayerHand 
          ref={el => playerRefs.current[2] = el}
          player={players[2]} 
          position="top" 
          isCurrentPlayer={currentPlayer === 2}
          cardCount={players[2].hand.length}
          message={playerMessages[2]}
          isDealer={dealer === 2}
          deckCount={deck.length}
          visualDeckCount={visualDeckCount}
          isDealing={isDealing}
          isReceivingCards={dealingTo === 'player2'}
          deckRef={dealer === 2 ? deckRef : null}
          revealedCard={aiRevealedCard?.playerIndex === 2 ? aiRevealedCard.card : null}
        />
        
        {/* AI 1 - Left (plays after human) */}
        <PlayerHand 
          ref={el => playerRefs.current[1] = el}
          player={players[1]} 
          position="left" 
          isCurrentPlayer={currentPlayer === 1}
          cardCount={players[1].hand.length}
          message={playerMessages[1]}
          isDealer={dealer === 1}
          deckCount={deck.length}
          visualDeckCount={visualDeckCount}
          isDealing={isDealing}
          isReceivingCards={dealingTo === 'player1'}
          deckRef={dealer === 1 ? deckRef : null}
          revealedCard={aiRevealedCard?.playerIndex === 1 ? aiRevealedCard.card : null}
        />
        
        {/* AI 3 - Right (plays after AI 2) */}
        <PlayerHand 
          ref={el => playerRefs.current[3] = el}
          player={players[3]} 
          position="right" 
          isCurrentPlayer={currentPlayer === 3}
          cardCount={players[3].hand.length}
          message={playerMessages[3]}
          isDealer={dealer === 3}
          deckCount={deck.length}
          visualDeckCount={visualDeckCount}
          isDealing={isDealing}
          isReceivingCards={dealingTo === 'player3'}
          deckRef={dealer === 3 ? deckRef : null}
          revealedCard={aiRevealedCard?.playerIndex === 3 ? aiRevealedCard.card : null}
        />

        {/* Table - Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] md:w-3/5 min-w-[180px] max-w-md">
          <div ref={tableRef} className={`bg-green-700 rounded-xl p-2 md:p-3 min-h-[100px] md:min-h-[120px] ${dealingTo === 'table' ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="text-white text-xs mb-1 md:mb-2 text-center">Table</div>
            <div className="flex flex-wrap gap-2 justify-center items-start">
              {table.map(card => (
                <Card
                  key={card.id}
                  ref={el => tableCardRefs.current[card.id] = el}
                  card={card}
                  selected={selectedTableCards.some(c => c.id === card.id)}
                  onClick={currentPlayer === 0 && !isDealing ? () => toggleTableCard(card) : undefined}
                  small
                />
              ))}
              {builds.map(build => (
                <Build
                  key={build.id}
                  ref={el => buildRefs.current[build.id] = el}
                  build={build}
                  selected={selectedBuilds.some(b => b.id === build.id)}
                  onClick={currentPlayer === 0 && !isDealing ? () => toggleBuild(build) : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player hand area */}
      <div ref={el => playerRefs.current[0] = el} className={`bg-green-900 rounded-xl p-2 md:p-3 mt-1 md:mt-2 relative ${dealingTo === 'player0' ? 'ring-2 ring-yellow-400' : ''}`}>
        <div className="flex justify-between items-center mb-1 md:mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs">{players[0].captured.length} capt, {players[0].sweeps} sweeps</span>
            {dealer === 0 && <span className="text-yellow-300 text-xs">(Dealer)</span>}
          </div>
          <span className="text-yellow-300 text-xs">{currentPlayer === 0 && !isDealing ? 'Your turn' : message}</span>
        </div>
        
        {playerMessages[0] && currentPlayer !== 0 && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-gray-800 text-xs px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-20">
            {playerMessages[0]}
            <div className="absolute w-2 h-2 bg-white transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
          </div>
        )}
        
        <div className="flex gap-1 md:gap-2 justify-center mb-2 md:mb-3 flex-wrap items-center">
          {dealer === 0 && (isDealing ? visualDeckCount : deck.length) > 0 && (
            <div className="mr-2" ref={deckRef}>
              <Deck count={isDealing ? visualDeckCount : deck.length} small={false} />
            </div>
          )}
          {players[0].hand.map(card => (
            <Card
              key={card.id}
              card={card}
              selected={selectedHandCard?.id === card.id}
              onClick={currentPlayer === 0 && !isDealing ? () => {
                setSelectedHandCard(selectedHandCard?.id === card.id ? null : card);
                if (buildMode) {
                  setBuildMode(false);
                  setBuildValue(null);
                }
              } : undefined}
            />
          ))}
        </div>
        
        {/* Flying card animation */}
        {flyingCard && (
          <FlyingCard 
            key={flyingCard.key}
            startPos={flyingCard.startPos} 
            endPos={flyingCard.endPos}
          />
        )}
        
        {/* AI move animations */}
        {aiAnimatingCards.map((anim, index) => (
          <AnimatedCard
            key={anim.key}
            card={anim.card}
            startPos={anim.startPos}
            endPos={anim.endPos}
            delay={anim.delay || 0}
          />
        ))}

        {currentPlayer === 0 && !isDealing && (
          <div className="flex gap-1 md:gap-2 justify-center flex-wrap items-center">
            <button
              onClick={executeCapture}
              disabled={!canCapture}
              className={`px-3 py-2 rounded-lg font-semibold text-sm ${canCapture ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-500 text-gray-300'}`}
            >
              Capture
            </button>
            
            {!buildMode ? (
              <button
                onClick={() => {
                  setBuildMode(true);
                  setSelectedTableCards([]);
                }}
                disabled={!selectedHandCard}
                className={`px-3 py-2 rounded-lg font-semibold text-sm ${selectedHandCard ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-500 text-gray-300'}`}
              >
                Build
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {selectedHandCard && !isFaceCard(selectedHandCard.rank) && (
                  <select
                    value={buildValue || ''}
                    onChange={(e) => setBuildValue(parseInt(e.target.value))}
                    className="px-2 py-2 rounded-lg text-sm"
                  >
                    <option value="">Value</option>
                    {[2,3,4,5,6,7,8,9,10].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}
                {selectedHandCard && isFaceCard(selectedHandCard.rank) && (
                  <span className="text-white text-sm">Build {selectedHandCard.rank}s</span>
                )}
                <button
                  onClick={executeBuild}
                  disabled={!canBuild}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm ${canBuild ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-500 text-gray-300'}`}
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setBuildMode(false);
                    setBuildValue(null);
                    setSelectedBuilds([]);
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 text-sm"
                >
                  ✕
                </button>
              </div>
            )}
            
            <button
              onClick={executeTrail}
              disabled={!canTrail}
              className={`px-3 py-2 rounded-lg font-semibold text-sm ${canTrail ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-500 text-gray-300'}`}
            >
              Trail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
