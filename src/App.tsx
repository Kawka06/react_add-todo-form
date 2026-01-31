import React, { useMemo, useState } from 'react';
import './App.scss';

import usersFromServer from './api/users';
import todosFromServer from './api/todos';
import { TodoList } from './components/TodoList/TodoList';

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

type TodoFromServer = {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
};

type Todo = TodoFromServer & {
  user: User;
};

const getUserById = (users: User[], userId: number): User => {
  const found = users.find(u => u.id === userId);

  // w tym zadaniu userId zawsze powinien istnieć w users,
  // ale zostawiamy bezpieczny fallback
  return (
    found || {
      id: 0,
      name: 'Unknown',
      username: 'unknown',
      email: 'unknown@example.com',
    }
  );
};

export const App: React.FC = () => {
  const users = usersFromServer as User[];
  const initialTodos = (todosFromServer as TodoFromServer[]).map(todo => ({
    ...todo,
    user: getUserById(users, todo.userId),
  }));

  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const [title, setTitle] = useState('');
  const [userId, setUserId] = useState(0);

  const [titleError, setTitleError] = useState(false);
  const [userError, setUserError] = useState(false);

  const nextId = useMemo(() => {
    const maxId = todos.reduce((max, todo) => Math.max(max, todo.id), 0);
    return maxId + 1;
  }, [todos]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Optional: tylko litery UA+EN, cyfry i spacje
    const cleaned = event.target.value.replace(/[^0-9a-zA-Z\u0400-\u04FF ]/g, '');

    setTitle(cleaned);

    if (titleError) {
      setTitleError(false);
    }
  };

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUserId(Number(event.target.value));

    if (userError) {
      setUserError(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const selectedUser = users.find(u => u.id === userId) || null;

    const hasTitleError = normalizedTitle.length === 0;
    const hasUserError = selectedUser === null;

    setTitleError(hasTitleError);
    setUserError(hasUserError);

    if (hasTitleError || hasUserError) {
      return;
    }

    const newTodo: Todo = {
      id: nextId,
      title: normalizedTitle,
      userId: selectedUser.id,
      completed: false,
      user: selectedUser,
    };

    setTodos(prev => [...prev, newTodo]);

    // clear form
    setTitle('');
    setUserId(0);
    setTitleError(false);
    setUserError(false);
  };

  return (
    <div className="App">
      <h1>Add todo form</h1>

      <form action="/api/todos" method="POST" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title-input">Title</label>

          <input
            id="title-input"
            type="text"
            data-cy="titleInput"
            placeholder="Enter a title"
            value={title}
            onChange={handleTitleChange}
          />

          {titleError && <span className="error">Please enter a title</span>}
        </div>

        <div className="field">
          <label htmlFor="user-select">User</label>

          <select
            id="user-select"
            data-cy="userSelect"
            value={userId}
            onChange={handleUserChange}
          >
            <option value={0}>Choose a user</option>

            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {userError && <span className="error">Please choose a user</span>}
        </div>

        <button type="submit" data-cy="submitButton">
          Add
        </button>
      </form>

      <TodoList todos={todos} />
    </div>
  );
};
