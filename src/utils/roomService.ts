import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Room, CreateRoomData, Player } from './roomTypes';

/**
 * ルームのコレクション名
 */
const ROOMS_COLLECTION = 'rooms';

/**
 * 新しいルームを作成
 * @param data ルーム作成データ
 * @returns 作成されたルームID
 */
export async function createRoom(data: CreateRoomData): Promise<string> {
  const roomRef = doc(collection(db, ROOMS_COLLECTION));
  const roomId = roomRef.id;

  const now = Date.now();
  
  const room: Room = {
    id: roomId,
    status: 'waiting',
    config: data.config,
    host: {
      uid: data.hostUid,
      role: 'host',
      isReady: false,
      guesses: [],
      lastActiveAt: now,
    },
    guest: null,
    currentTurn: 'host',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(roomRef, room);
  return roomId;
}

/**
 * ルームに参加
 * @param roomId ルームID
 * @param guestUid ゲストのUID
 * @returns 成功した場合true
 */
export async function joinRoom(roomId: string, guestUid: string): Promise<boolean> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('ルームが見つかりません');
  }

  const room = roomSnap.data() as Room;

  if (room.guest !== null) {
    throw new Error('ルームは既に満員です');
  }

  if (room.status !== 'waiting') {
    throw new Error('このルームには参加できません');
  }

  const now = Date.now();
  const guest: Player = {
    uid: guestUid,
    role: 'guest',
    isReady: false,
    guesses: [],
    lastActiveAt: now,
  };

  await updateDoc(roomRef, {
    guest,
    updatedAt: now,
  });

  return true;
}

/**
 * プレイヤーの準備完了状態を更新
 * @param roomId ルームID
 * @param playerUid プレイヤーのUID
 * @param isReady 準備完了フラグ
 */
export async function updatePlayerReady(
  roomId: string, 
  playerUid: string, 
  isReady: boolean
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('ルームが見つかりません');
  }

  const room = roomSnap.data() as Room;

  // プレイヤーの役割を判定
  if (room.host.uid === playerUid) {
    await updateDoc(roomRef, {
      'host.isReady': isReady,
      updatedAt: Date.now(),
    });
  } else if (room.guest?.uid === playerUid) {
    await updateDoc(roomRef, {
      'guest.isReady': isReady,
      updatedAt: Date.now(),
    });
  }
}

/**
 * プレイヤーの秘密の数字を設定
 * @param roomId ルームID
 * @param playerUid プレイヤーのUID
 * @param secret 秘密の数字
 */
export async function setPlayerSecret(
  roomId: string,
  playerUid: string,
  secret: string
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('ルームが見つかりません');
  }

  const room = roomSnap.data() as Room;

  if (room.host.uid === playerUid) {
    await updateDoc(roomRef, {
      'host.secret': secret,
      updatedAt: Date.now(),
    });
  } else if (room.guest?.uid === playerUid) {
    await updateDoc(roomRef, {
      'guest.secret': secret,
      updatedAt: Date.now(),
    });
  }
}

/**
 * ゲームを開始（両プレイヤーが準備完了の場合）
 * @param roomId ルームID
 */
export async function startGame(roomId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('ルームが見つかりません');
  }

  const room = roomSnap.data() as Room;

  // 両プレイヤーが準備完了かチェック
  if (!room.host.isReady || !room.guest?.isReady) {
    throw new Error('両プレイヤーが準備完了していません');
  }

  // 秘密の数字が設定されているかチェック
  if (!room.host.secret || !room.guest.secret) {
    throw new Error('秘密の数字が設定されていません');
  }

  await updateDoc(roomRef, {
    status: 'playing',
    updatedAt: Date.now(),
  });
}

/**
 * ルーム情報を取得
 * @param roomId ルームID
 * @returns ルーム情報
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    return null;
  }

  return roomSnap.data() as Room;
}

/**
 * ルーム情報の変更をリアルタイムで監視
 * @param roomId ルームID
 * @param callback 変更時のコールバック
 * @returns 監視を停止する関数
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): Unsubscribe {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  return onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Room);
    } else {
      callback(null);
    }
  });
}

/**
 * 待機中のルーム一覧を取得
 * @param maxCount 最大取得件数（デフォルト: 20）
 * @returns 待機中のルーム一覧（新しい順）
 */
export async function getWaitingRooms(maxCount: number = 20): Promise<Room[]> {
  const roomsRef = collection(db, ROOMS_COLLECTION);
  const q = query(
    roomsRef,
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'desc'),
    limit(maxCount)
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as Room);
}

/**
 * 推測を送信
 * @param roomId ルームID
 * @param playerUid プレイヤーのUID
 * @param guess 推測した数字
 */
export async function submitGuess(
  roomId: string,
  playerUid: string,
  guess: string
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('ルームが見つかりません');
  }

  const room = roomSnap.data() as Room;

  // プレイヤーの役割を判定
  let isHost = false;
  if (room.host.uid === playerUid) {
    isHost = true;
  } else if (room.guest?.uid !== playerUid) {
    throw new Error('プレイヤーが見つかりません');
  }

  // 推測履歴に追加
  const guesses = isHost ? [...room.host.guesses, guess] : [...(room.guest?.guesses || []), guess];

  // ターンを切り替え
  const nextTurn = isHost ? 'guest' : 'host';

  if (isHost) {
    await updateDoc(roomRef, {
      'host.guesses': guesses,
      currentTurn: nextTurn,
      updatedAt: Date.now(),
    });
  } else {
    await updateDoc(roomRef, {
      'guest.guesses': guesses,
      currentTurn: nextTurn,
      updatedAt: Date.now(),
    });
  }
}

/**
 * ゲームを終了
 * @param roomId ルームID
 */
export async function finishGame(roomId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  await updateDoc(roomRef, {
    status: 'finished',
    updatedAt: Date.now(),
  });
}

/**
 * ルームを削除
 * @param roomId ルームID
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await deleteDoc(roomRef);
}

/**
 * プレイヤーのアクティブ状態を更新
 * @param roomId ルームID
 * @param playerUid プレイヤーのUID
 */
export async function updatePlayerActive(
  roomId: string,
  playerUid: string
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    return;
  }

  const room = roomSnap.data() as Room;
  const now = Date.now();

  if (room.host.uid === playerUid) {
    await updateDoc(roomRef, {
      'host.lastActiveAt': now,
      updatedAt: now,
    });
  } else if (room.guest?.uid === playerUid) {
    await updateDoc(roomRef, {
      'guest.lastActiveAt': now,
      updatedAt: now,
    });
  }
}
