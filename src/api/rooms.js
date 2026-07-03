import api from './axios';

export const getRooms = (params) => api.get('/rooms', { params }).then((r) => r.data.rooms);
export const getRoomById = (id) => api.get(`/rooms/${id}`).then((r) => r.data.room);
export const createRoom = (data) => api.post('/rooms', data).then((r) => r.data.room);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then((r) => r.data.room);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then((r) => r.data);

// Upload beberapa foto sekaligus untuk satu room. `files` adalah FileList / array of File.
export const uploadRoomImages = (roomId, files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append('images', file));
  return api
    .post(`/rooms/${roomId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.images);
};

export const deleteRoomImage = (roomId, imageId) =>
  api.delete(`/rooms/${roomId}/images/${imageId}`).then((r) => r.data);
