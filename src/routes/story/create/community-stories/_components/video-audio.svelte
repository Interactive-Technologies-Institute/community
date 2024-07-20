<script lang="ts">
  import { onDestroy, afterUpdate } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Video, Mic } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let videoStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let isRecording = false;
  let recordingType = '';
  let audioRecorder: MediaRecorder;
  let audioChunks: BlobPart[] = [];
  $: showDialog = false; 


  export let page;

  function updateStep() {
    page = 4;

    // Create video file
    const videoBlob = new Blob(recordedChunks, { type: 'video/mp4' });
    const file = new File([videoBlob], 'media.mp4', { type: 'video/mp4' });

    // Create audio file
    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
    const audio = new File([audioBlob], 'media.mp3', { type: 'audio/mp3' });

    dispatch('updateStep', { page, file, audio });
  }

  // Reference to the video element
  let videoElement: HTMLVideoElement | null = null;

  async function startRecording(recordingT: string) {
    try {
      recordingType = recordingT;
      const mediaConstraints = { video: true, audio: true };

      videoStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // Separate audio stream
      const audioStream = new MediaStream(videoStream.getAudioTracks());

      // Video recording setup
      mediaRecorder = new MediaRecorder(videoStream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Audio recording setup
      audioRecorder = new MediaRecorder(audioStream);
      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();
      audioRecorder.start();
      isRecording = true;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access media devices. Please check your permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && videoStream) {
      mediaRecorder.stop();
      videoStream.getTracks().forEach(track => track.stop());
      isRecording = false;
    }
    
    if (audioRecorder) {
      audioRecorder.stop();
    }

    showDialog = true;
  }

  // Update the video element's srcObject when the component updates
  afterUpdate(() => {
    if (recordingType === 'video' && videoElement && videoStream) {
      console.log('Setting srcObject for video element');
      videoElement.srcObject = videoStream;
      videoElement.play();
    }
  });

  // Clean up the stream and media recorder on component destroy
  onDestroy(() => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioRecorder) {
      audioRecorder.stream.getTracks().forEach(track => track.stop());
    }
  });

  function closeDialog() {
    showDialog = false;
  }

  function restart () {
    recordingType = '';
    showDialog = false; // Show the dialog when recording stops
    onDestroy;
  } 
</script>

<div>
  {#if recordingType === ''}
    <Button on:click={() => startRecording('video')} disabled={isRecording}>
      <Video />
    </Button>
    <Button on:click={() => startRecording('audio')} disabled={isRecording}>
      <Mic />
    </Button>
  {:else}
    {#if recordingType === 'video' && isRecording}
      <video class="pb-5" bind:this={videoElement} autoplay muted></video>
    {/if}
    <Button on:click={recordingType === 'video' ? stopRecording : () => startRecording('video')}
            class={isRecording && recordingType === 'video' ? 'bg-red-800 animate-blink' : ''}
            disabled={recordingType !== 'video' && isRecording}>
      <Video />
    </Button>
    <Button on:click={recordingType === 'audio' ? stopRecording : () => startRecording('audio')}
            class={isRecording && recordingType === 'audio' ? 'bg-red-800 animate-blink' : ''}
            disabled={recordingType !== 'audio' && isRecording}>
      <Mic />
    </Button>
  {/if}

  <AlertDialog.Root  bind:open={showDialog}>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Desejas salvar este { recordingType === 'video' ? 'vídeo' : 'áudio' }?</AlertDialog.Title>
          <AlertDialog.Description>
            Se não quiseres, este { recordingType === 'video' ? 'vídeo' : 'áudio' } será descartado e poderás gravar outro.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel on:click={closeDialog}>Cancelar</AlertDialog.Cancel>
          <AlertDialog.Action on:click={restart}>Gravar outro</AlertDialog.Action>
          <AlertDialog.Action on:click={updateStep}>Salvar</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
  </AlertDialog.Root>
</div>