// Function to display a message on the screen
export function setupText(message) {
    // Create a div element for the message
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.position = 'absolute';
    messageElement.style.fontFamily = 'monospace';
    messageElement.style.top = '10px';
    messageElement.style.left = '10px';
    messageElement.style.color = 'white';

    // Append the message element to the body
    document.body.appendChild(messageElement);
}
