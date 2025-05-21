import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      showMessage('Failed to fetch todos. Please check server connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) {
      showMessage('Task cannot be empty!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: newTask, completed: false }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewTask(''); 
      await fetchTodos(); 
      showMessage('Todo added successfully!', 'success');
    } catch (error) {
      console.error('Error adding todo:', error);
      showMessage('Failed to add todo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTaskText(todo.task);
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditingTaskText('');
  };

  const updateTodo = async (id) => {
    if (!editingTaskText.trim()) {
      showMessage('Task cannot be empty!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: editingTaskText,
          completed: todoToUpdate ? todoToUpdate.completed : false, 
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setEditingTodoId(null); 
      setEditingTaskText('');
      await fetchTodos(); 
      showMessage('Todo updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating todo:', error);
      showMessage('Failed to update todo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchTodos(); 
      showMessage('Todo deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting todo:', error);
      showMessage('Failed to delete todo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (todo) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: todo.task,
          completed: !todo.completed, 
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchTodos(); 
      showMessage('Todo status updated!', 'success');
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      showMessage('Failed to update todo status.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeTodos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
      });
      const resultText = await response.text(); 
      if (response.ok) {
        showMessage(resultText, 'success');
      } else {
        showMessage(`Error: ${resultText}`, 'error');
      }
    } catch (error) {
      console.error('Error summarizing todos:', error);
      showMessage('Failed to summarize todos or send to Slack. Network error.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-xl">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
          Todo Summary Assistant
        </h1>

        {message && (
          <div
            className={`p-4 mb-4 rounded-lg text-white font-medium ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Add a new todo..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading && newTask ? 'Adding...' : 'Add Todo'}
          </button>
        </form>

        {isLoading && !todos.length ? (
          <div className="text-center text-gray-600 text-lg">Loading todos...</div>
        ) : todos.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">No todos yet! Add some tasks.</div>
        ) : (
          <ul className="space-y-4 mb-8">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
              >
                {editingTodoId === todo.id ? (
                  <div className="flex-grow flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={editingTaskText}
                      onChange={(e) => setEditingTaskText(e.target.value)}
                      className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        onClick={() => updateTodo(todo.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-lg cursor-pointer flex-grow ${
                        todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}
                      onClick={() => toggleComplete(todo)}
                    >
                      {todo.task}
                    </span>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => startEditing(todo)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded-md transition duration-200 text-sm disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-md transition duration-200 text-sm disabled:opacity-50"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={summarizeTodos}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Summarize & Send to Slack
        </button>
      </div>
    </div>
  );
}

export default App;
