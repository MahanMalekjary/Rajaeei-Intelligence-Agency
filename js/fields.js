export const fields = [
    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name', icon: 'user', required: true },
    { id: 'nickname', label: 'Nickname', type: 'text', placeholder: 'Enter nickname', icon: 'at-sign' },
    { id: 'age', label: 'Age', type: 'number', placeholder: 'Enter age', icon: 'calendar' },
    { id: 'birthday', label: 'Birthday', type: 'date', placeholder: '', icon: 'gift' },
    { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'], icon: 'users' },
    { id: 'country', label: 'Country', type: 'text', placeholder: 'Enter country', icon: 'globe' },
    { id: 'city', label: 'City', type: 'text', placeholder: 'Enter city', icon: 'map-pin' },
    { id: 'occupation', label: 'Occupation', type: 'text', placeholder: 'Enter occupation', icon: 'briefcase' },
    { id: 'biography', label: 'Biography', type: 'textarea', placeholder: 'Write a short biography...', icon: 'file-text' },
    { id: 'personality', label: 'Personality', type: 'text', placeholder: 'e.g., Introverted, Analytical', icon: 'smile' },
    { id: 'interests', label: 'Interests', type: 'list', placeholder: 'Add interest', icon: 'star' },
    { id: 'favorite_music', label: 'Favorite Music', type: 'list', placeholder: 'Add artist or genre', icon: 'music' },
    { id: 'favorite_movies', label: 'Favorite Movies', type: 'list', placeholder: 'Add movie', icon: 'film' },
    { id: 'favorite_games', label: 'Favorite Games', type: 'list', placeholder: 'Add game', icon: 'gamepad-2' },
    { id: 'favorite_books', label: 'Favorite Books', type: 'list', placeholder: 'Add book', icon: 'book-open' },
    { id: 'skills', label: 'Skills', type: 'list', placeholder: 'Add skill', icon: 'zap' },
    { id: 'languages', label: 'Languages', type: 'list', placeholder: 'Add language', icon: 'message-circle' },
    { id: 'social_media', label: 'Social Media', type: 'social', placeholder: 'Add link', icon: 'share-2' },
    { id: 'phone', label: 'Phone', type: 'text', placeholder: 'Enter phone number', icon: 'phone' },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address', icon: 'mail' },
    { id: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes & Defcon level(DE-NHP-CWPB-CWWB-WNL-DW)', icon: 'clipboard' }
];

export function getFieldById(id) {
    return fields.find(f => f.id === id);
}