/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as legacy from '@firebase/firestore-types';
import * as exp from '../';

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  clearIndexedDbPersistence,
  collection,
  collectionGroup,
  deleteDoc,
  deleteField,
  disableNetwork,
  doc,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  enableNetwork,
  DocumentReference as DocumentReferenceExp,
  FieldPath as FieldPathExp,
  getDoc,
  getQuery,
  getQueryFromCache,
  getQueryFromServer,
  increment,
  onSnapshot,
  onSnapshotsInSync,
  parent,
  queryEqual,
  refEqual,
  runTransaction,
  serverTimestamp,
  setDoc,
  snapshotEqual,
  terminate,
  updateDoc,
  waitForPendingWrites,
  writeBatch,
  getDocFromCache,
  getDocFromServer,
  initializeFirestore
} from '../../exp/index.node';
import { UntypedFirestoreDataConverter } from '../../src/api/user_data_reader';
import { isPartialObserver, PartialObserver } from '../../src/api/observer';
import { isPlainObject } from '../../src/util/input_validation';

export { GeoPoint, Blob, Timestamp } from '../../exp/index.node';

/* eslint-disable @typescript-eslint/no-explicit-any */

// This module defines a shim layer that implements the legacy API on top
// of the experimental SDK. This shim is used to run integration tests against
// both SDK versions.

export class FirebaseFirestore implements legacy.FirebaseFirestore {
  constructor(private readonly _delegate: exp.FirebaseFirestore) {}

  app = this._delegate.app;

  settings(settings: legacy.Settings): void {
    initializeFirestore(this.app, settings);
  }

  enablePersistence(settings?: legacy.PersistenceSettings): Promise<void> {
    return settings?.synchronizeTabs
      ? enableMultiTabIndexedDbPersistence(this._delegate)
      : enableIndexedDbPersistence(this._delegate);
  }

  collection(collectionPath: string): CollectionReference<legacy.DocumentData> {
    return new CollectionReference(collection(this._delegate, collectionPath));
  }

  doc(documentPath: string): DocumentReference<legacy.DocumentData> {
    return new DocumentReference(doc(this._delegate, documentPath));
  }

  collectionGroup(collectionId: string): Query<legacy.DocumentData> {
    return new Query(collectionGroup(this._delegate, collectionId));
  }

  runTransaction<T>(
    updateFunction: (transaction: legacy.Transaction) => Promise<T>
  ): Promise<T> {
    return runTransaction(this._delegate, t =>
      updateFunction(new Transaction(t))
    );
  }

  batch(): legacy.WriteBatch {
    return new WriteBatch(writeBatch(this._delegate));
  }

  clearPersistence(): Promise<void> {
    return clearIndexedDbPersistence(this._delegate);
  }

  enableNetwork(): Promise<void> {
    return enableNetwork(this._delegate);
  }

  disableNetwork(): Promise<void> {
    return disableNetwork(this._delegate);
  }

  waitForPendingWrites(): Promise<void> {
    return waitForPendingWrites(this._delegate);
  }

  onSnapshotsInSync(observer: {
    next?: (value: void) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }): () => void;
  onSnapshotsInSync(onSync: () => void): () => void;
  onSnapshotsInSync(arg: any): () => void {
    return onSnapshotsInSync(this._delegate, arg);
  }

  terminate(): Promise<void> {
    return terminate(this._delegate);
  }

  INTERNAL = {
    delete: () => terminate(this._delegate)
  };
}

export class Transaction implements legacy.Transaction {
  constructor(private readonly _delegate: exp.Transaction) {}

  get<T>(documentRef: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
    return this._delegate
      .get(documentRef._delegate)
      .then(result => new DocumentSnapshot(result));
  }

  set<T>(
    documentRef: DocumentReference<T>,
    data: T,
    options?: legacy.SetOptions
  ): Transaction {
    if (options) {
      this._delegate.set(documentRef._delegate, unwwrap(data), options);
    } else {
      this._delegate.set(documentRef._delegate, unwwrap(data));
    }
    return this;
  }

  update(
    documentRef: DocumentReference<any>,
    data: legacy.UpdateData
  ): Transaction;
  update(
    documentRef: DocumentReference<any>,
    field: string | FieldPath,
    value: any,
    ...moreFieldsAndValues: any[]
  ): Transaction;
  update(
    documentRef: DocumentReference<any>,
    dataOrField: any,
    value?: any,
    ...moreFieldsAndValues: any[]
  ): Transaction {
    if (arguments.length === 2) {
      this._delegate.update(documentRef._delegate, unwwrap(dataOrField));
    } else {
      this._delegate.update(
        documentRef._delegate,
        unwwrap(dataOrField),
        value,
        ...unwwrap(moreFieldsAndValues)
      );
    }

    return this;
  }

  delete(documentRef: DocumentReference<any>): Transaction {
    this._delegate.delete(documentRef._delegate);
    return this;
  }
}

export class WriteBatch implements legacy.WriteBatch {
  constructor(private readonly _delegate: exp.WriteBatch) {}

  set<T>(
    documentRef: DocumentReference<T>,
    data: T,
    options?: legacy.SetOptions
  ): WriteBatch {
    if (options) {
      this._delegate.set(documentRef._delegate, unwwrap(data), options);
    } else {
      this._delegate.set(documentRef._delegate, unwwrap(data));
    }
    return this;
  }

  update(
    documentRef: DocumentReference<any>,
    data: legacy.UpdateData
  ): WriteBatch;
  update(
    documentRef: DocumentReference<any>,
    field: string | FieldPath,
    value: any,
    ...moreFieldsAndValues: any[]
  ): WriteBatch;
  update(
    documentRef: DocumentReference<any>,
    dataOrField: any,
    value?: any,
    ...moreFieldsAndValues: any[]
  ): WriteBatch {
    if (arguments.length === 2) {
      this._delegate.update(documentRef._delegate, unwwrap(dataOrField));
    } else {
      this._delegate.update(
        documentRef._delegate,
        unwwrap(dataOrField),
        value,
        ...unwwrap(moreFieldsAndValues)
      );
    }

    return this;
  }

  delete(documentRef: DocumentReference<any>): WriteBatch {
    this._delegate.delete(documentRef._delegate);
    return this;
  }

  commit(): Promise<void> {
    return this._delegate.commit();
  }
}

export class DocumentReference<T = legacy.DocumentData>
  implements legacy.DocumentReference<T> {
  constructor(readonly _delegate: exp.DocumentReference<T>) {}

  readonly id = this._delegate.id;
  readonly firestore = new FirebaseFirestore(this._delegate.firestore);
  readonly path = this._delegate.path;

  get parent(): legacy.CollectionReference<T> {
    return new CollectionReference<T>(parent(this._delegate));
  }

  collection(
    collectionPath: string
  ): legacy.CollectionReference<legacy.DocumentData> {
    return new CollectionReference(collection(this._delegate, collectionPath));
  }

  isEqual(other: DocumentReference<T>): boolean {
    return refEqual(this._delegate, other._delegate);
  }

  set(data: Partial<T>, options?: legacy.SetOptions): Promise<void> {
    if (options) {
      return setDoc(this._delegate, unwwrap(data), options);
    } else {
      return setDoc(this._delegate, unwwrap(data));
    }
  }

  update(data: legacy.UpdateData): Promise<void>;
  update(
    field: string | FieldPath,
    value: any,
    ...moreFieldsAndValues: any[]
  ): Promise<void>;
  update(
    dataOrField: any,
    value?: any,
    ...moreFieldsAndValues: any[]
  ): Promise<void> {
    if (arguments.length === 1) {
      return updateDoc(this._delegate, unwwrap(dataOrField));
    } else {
      return updateDoc(
        this._delegate,
        unwwrap(dataOrField),
        value,
        ...unwwrap(moreFieldsAndValues)
      );
    }
  }

  delete(): Promise<void> {
    return deleteDoc(this._delegate);
  }

  get(options?: legacy.GetOptions): Promise<DocumentSnapshot<T>> {
    let snap: Promise<exp.DocumentSnapshot<T>>;
    if (options?.source === 'cache') {
      snap = getDocFromCache(this._delegate);
    } else if (options?.source === 'server') {
      snap = getDocFromServer(this._delegate);
    } else {
      snap = getDoc(this._delegate);
    }
    return snap.then(result => new DocumentSnapshot(result));
  }

  onSnapshot(observer: {
    next?: (snapshot: DocumentSnapshot<T>) => void;
    error?: (error: legacy.FirestoreError) => void;
    complete?: () => void;
  }): () => void;
  onSnapshot(
    options: legacy.SnapshotListenOptions,
    observer: {
      next?: (snapshot: DocumentSnapshot<T>) => void;
      error?: (error: Error) => void;
      complete?: () => void;
    }
  ): () => void;
  onSnapshot(
    onNext: (snapshot: DocumentSnapshot<T>) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void
  ): () => void;
  onSnapshot(
    options: legacy.SnapshotListenOptions,
    onNext: (snapshot: DocumentSnapshot<T>) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void
  ): () => void;
  onSnapshot(...args: any): () => void {
    let options: legacy.SnapshotListenOptions = {};
    let userObserver: PartialObserver<DocumentSnapshot<T>>;

    if (isPartialObserver(args[0])) {
      userObserver = args[0] as PartialObserver<DocumentSnapshot<T>>;
    } else if (isPartialObserver(args[1])) {
      options = args[0];
      userObserver = args[1];
    } else if (typeof args[0] === 'function') {
      userObserver = {
        next: args[0],
        error: args[1],
        complete: args[2]
      };
    } else {
      options = args[0];
      userObserver = {
        next: args[1],
        error: args[2],
        complete: args[3]
      };
    }

    const apiObserver: PartialObserver<exp.DocumentSnapshot<T>> = {
      next: snapshot => {
        if (userObserver!.next) {
          userObserver!.next(new DocumentSnapshot(snapshot));
        }
      },
      error: userObserver.error?.bind(userObserver),
      complete: userObserver.complete?.bind(userObserver)
    };

    return onSnapshot(this._delegate, options, apiObserver);
  }

  withConverter<U>(
    converter: legacy.FirestoreDataConverter<U>
  ): DocumentReference<U> {
    return new DocumentReference<U>(
      this._delegate.withConverter(
        converter as UntypedFirestoreDataConverter<U>
      )
    );
  }
}

export class DocumentSnapshot<T = legacy.DocumentData>
  implements legacy.DocumentSnapshot<T> {
  constructor(readonly _delegate: exp.DocumentSnapshot<T>) {}

  readonly ref = new DocumentReference<T>(this._delegate.ref);
  readonly id = this._delegate.id;
  readonly metadata = this._delegate.metadata;

  get exists(): boolean {
    return this._delegate.exists();
  }

  data(options?: legacy.SnapshotOptions): T | undefined {
    return wrap(this._delegate.data(options));
  }

  get(fieldPath: string | FieldPath, options?: legacy.SnapshotOptions): any {
    return wrap(this._delegate.get(unwwrap(fieldPath), options));
  }

  isEqual(other: DocumentSnapshot<T>): boolean {
    return snapshotEqual(this._delegate, other._delegate);
  }
}

export class QueryDocumentSnapshot<T = legacy.DocumentData>
  extends DocumentSnapshot<T>
  implements legacy.QueryDocumentSnapshot<T> {
  constructor(readonly _delegate: exp.QueryDocumentSnapshot<T>) {
    super(_delegate);
  }

  data(options?: legacy.SnapshotOptions): T {
    return this._delegate.data(options);
  }
}

export class Query<T = legacy.DocumentData> implements legacy.Query<T> {
  constructor(readonly _delegate: exp.Query<T>) {}

  readonly firestore = new FirebaseFirestore(this._delegate.firestore);

  where(
    fieldPath: string | FieldPath,
    opStr: legacy.WhereFilterOp,
    value: any
  ): Query<T> {
    return new Query<T>(
      this._delegate.where(unwwrap(fieldPath), opStr, unwwrap(value))
    );
  }

  orderBy(
    fieldPath: string | FieldPath,
    directionStr?: legacy.OrderByDirection
  ): Query<T> {
    return new Query<T>(
      this._delegate.orderBy(unwwrap(fieldPath), directionStr)
    );
  }

  limit(limit: number): Query<T> {
    return new Query<T>(this._delegate.limit(limit));
  }

  limitToLast(limit: number): Query<T> {
    return new Query<T>(this._delegate.limitToLast(limit));
  }

  startAt(...args: any[]): Query<T> {
    if (args[0] instanceof DocumentSnapshot) {
      return new Query(this._delegate.startAt(args[0]._delegate));
    } else {
      return new Query(this._delegate.startAt(...unwwrap(args)));
    }
  }

  startAfter(...args: any[]): Query<T> {
    if (args[0] instanceof DocumentSnapshot) {
      return new Query(this._delegate.startAfter(args[0]._delegate));
    } else {
      return new Query(this._delegate.startAfter(...unwwrap(args)));
    }
  }

  endBefore(...args: any[]): Query<T> {
    if (args[0] instanceof DocumentSnapshot) {
      return new Query(this._delegate.endBefore(args[0]._delegate));
    } else {
      return new Query(this._delegate.endBefore(...unwwrap(args)));
    }
  }

  endAt(...args: any[]): Query<T> {
    if (args[0] instanceof DocumentSnapshot) {
      return new Query(this._delegate.endAt(args[0]._delegate));
    } else {
      return new Query(this._delegate.endAt(...unwwrap(args)));
    }
  }

  isEqual(other: legacy.Query<T>): boolean {
    return queryEqual(this._delegate, (other as Query<T>)._delegate);
  }

  get(options?: legacy.GetOptions): Promise<QuerySnapshot<T>> {
    let query: Promise<exp.QuerySnapshot<T>>;
    if (options?.source === 'cache') {
      query = getQueryFromCache(this._delegate);
    } else if (options?.source === 'server') {
      query = getQueryFromServer(this._delegate);
    } else {
      query = getQuery(this._delegate);
    }
    return query.then(result => new QuerySnapshot(result));
  }

  onSnapshot(observer: {
    next?: (snapshot: QuerySnapshot<T>) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }): () => void;
  onSnapshot(
    options: legacy.SnapshotListenOptions,
    observer: {
      next?: (snapshot: QuerySnapshot<T>) => void;
      error?: (error: Error) => void;
      complete?: () => void;
    }
  ): () => void;
  onSnapshot(
    onNext: (snapshot: QuerySnapshot<T>) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void
  ): () => void;
  onSnapshot(
    options: legacy.SnapshotListenOptions,
    onNext: (snapshot: QuerySnapshot<T>) => void,
    onError?: (error: Error) => void,
    onCompletion?: () => void
  ): () => void;
  onSnapshot(...args: any): () => void {
    let options: legacy.SnapshotListenOptions = {};
    let userObserver: PartialObserver<QuerySnapshot<T>>;

    if (isPartialObserver(args[0])) {
      userObserver = args[0] as PartialObserver<QuerySnapshot<T>>;
    } else if (isPartialObserver(args[1])) {
      options = args[0];
      userObserver = args[1];
    } else if (typeof args[0] === 'function') {
      userObserver = {
        next: args[0],
        error: args[1],
        complete: args[2]
      };
    } else {
      options = args[0];
      userObserver = {
        next: args[1],
        error: args[2],
        complete: args[3]
      };
    }

    const apiObserver: PartialObserver<exp.QuerySnapshot<T>> = {
      next: snapshot => {
        if (userObserver!.next) {
          userObserver!.next(new QuerySnapshot(snapshot));
        }
      },
      error: userObserver.error?.bind(userObserver),
      complete: userObserver.complete?.bind(userObserver)
    };

    return onSnapshot(this._delegate, options, apiObserver);
  }

  withConverter<U>(converter: legacy.FirestoreDataConverter<U>): Query<U> {
    return new Query<U>(
      this._delegate.withConverter(
        converter as UntypedFirestoreDataConverter<U>
      )
    );
  }
}

export class QuerySnapshot<T = legacy.DocumentData>
  implements legacy.QuerySnapshot<T> {
  constructor(readonly _delegate: exp.QuerySnapshot<T>) {}

  readonly query = new Query(this._delegate.query);
  readonly metadata = this._delegate.metadata;
  readonly size = this._delegate.size;
  readonly empty = this._delegate.empty;

  get docs(): Array<QueryDocumentSnapshot<T>> {
    return this._delegate.docs.map(doc => new QueryDocumentSnapshot<T>(doc));
  }

  docChanges(options?: legacy.SnapshotListenOptions): Array<DocumentChange<T>> {
    return this._delegate
      .docChanges(options)
      .map(docChange => new DocumentChange<T>(docChange));
  }

  forEach(
    callback: (result: QueryDocumentSnapshot<T>) => void,
    thisArg?: any
  ): void {
    this._delegate.forEach(snapshot => {
      callback.call(thisArg, new QueryDocumentSnapshot(snapshot));
    });
  }

  isEqual(other: QuerySnapshot<T>): boolean {
    return snapshotEqual(this._delegate, other._delegate);
  }
}

export class DocumentChange<T = legacy.DocumentData>
  implements legacy.DocumentChange<T> {
  constructor(private readonly _delegate: exp.DocumentChange<T>) {}
  readonly type = this._delegate.type;
  readonly doc = new QueryDocumentSnapshot<T>(this._delegate.doc);
  readonly oldIndex = this._delegate.oldIndex;
  readonly newIndex = this._delegate.oldIndex;
}

export class CollectionReference<T = legacy.DocumentData> extends Query<T>
  implements legacy.CollectionReference<T> {
  constructor(readonly _delegate: exp.CollectionReference<T>) {
    super(_delegate);
  }

  readonly id = this._delegate.id;
  readonly path = this._delegate.path;

  get parent(): DocumentReference<legacy.DocumentData> | null {
    const docRef = parent(this._delegate);
    return docRef ? new DocumentReference<legacy.DocumentData>(docRef) : null;
  }

  doc(documentPath?: string): DocumentReference<T> {
    if (documentPath !== undefined) {
      return new DocumentReference<T>(doc(this._delegate, documentPath));
    } else {
      return new DocumentReference<T>(doc(this._delegate));
    }
  }

  add(data: T): Promise<DocumentReference<T>> {
    return addDoc(this._delegate, unwwrap(data)).then(
      docRef => new DocumentReference(docRef)
    );
  }

  isEqual(other: CollectionReference<T>): boolean {
    return refEqual(this._delegate, other._delegate);
  }

  withConverter<U>(
    converter: legacy.FirestoreDataConverter<U>
  ): CollectionReference<U> {
    return new CollectionReference<U>(
      this._delegate.withConverter(
        converter as UntypedFirestoreDataConverter<U>
      )
    );
  }
}

export class FieldValue implements legacy.FieldValue {
  constructor(private readonly delegate: exp.FieldValue) {}
  static serverTimestamp(): FieldValue {
    return new FieldValue(serverTimestamp());
  }

  static delete(): FieldValue {
    return new FieldValue(deleteField());
  }

  static arrayUnion(...elements: any[]): FieldValue {
    return new FieldValue(arrayUnion(...elements));
  }

  static arrayRemove(...elements: any[]): FieldValue {
    return new FieldValue(arrayRemove(...elements));
  }

  static increment(n: number): FieldValue {
    return new FieldValue(increment(n));
  }

  isEqual(other: FieldValue): boolean {
    return this.delegate.isEqual(other.delegate);
  }
}

export class FieldPath implements legacy.FieldPath {
  private fieldNames: string[];

  constructor(...fieldNames: string[]) {
    this.fieldNames = fieldNames;
  }

  get _delegate(): FieldPathExp {
    return new FieldPathExp(...this.fieldNames);
  }

  static documentId(): FieldPath {
    return new FieldPath('__name__');
  }

  isEqual(other: FieldPath): boolean {
    throw new Error('isEqual() is not supported in shim');
  }
}

/**
 * Takes document data that uses the firestore-exp API types and replaces them
 * with the API types defined in this shim.
 */
function wrap(value: any): any {
  if (Array.isArray(value)) {
    return value.map(v => wrap(v));
  } else if (value instanceof FieldPathExp) {
    return new FieldPath(...value._internalPath.toArray());
  } else if (value instanceof DocumentReferenceExp) {
    return new DocumentReference(value);
  } else if (isPlainObject(value)) {
    const obj: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        obj[key] = wrap(value[key]);
      }
    }
    return obj;
  } else {
    return value;
  }
}

/**
 * Takes user data that uses API types from this shim and replaces them
 * with the the firestore-exp API types.
 */
function unwwrap(value: any): any {
  if (Array.isArray(value)) {
    return value.map(v => unwwrap(v));
  } else if (value instanceof FieldPath) {
    return value._delegate;
  } else if (value instanceof DocumentReference) {
    return value._delegate;
  } else if (isPlainObject(value)) {
    const obj: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        obj[key] = unwwrap(value[key]);
      }
    }
    return obj;
  } else {
    return value;
  }
}
