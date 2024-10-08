<script lang="ts">
  import { PUBLIC_CLOUDINARY_CLOUD_NAME, PUBLIC_OPENAI_API_KEY } from '$env/static/public';
  import { Button } from "$lib/components/ui/button";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { type CarouselAPI } from "$lib/components/ui/carousel/context.js";
  import * as Card from "$lib/components/ui/card/index.js";

  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import { PencilLine } from 'lucide-svelte'

  import InPlaceEdit from './in-place-edit.svelte'
	import PageHeader from "@/components/page-header.svelte";
	import { createStorySchema, type CreateStorySchema } from "@/schemas/story";
	import { onMount } from "svelte";
	import { superForm, type Infer, type SuperValidated } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
  import OpenAI from "openai";
	import { applyAction, deserialize } from '$app/forms';
  import { Loader2 } from 'lucide-svelte';

  
	export let data: SuperValidated<Infer<CreateStorySchema>>;
	export let user;
    
    const form = superForm(data, {
      validators: zodClient(createStorySchema),
      taintedMessage: true,
      dataType: 'json',
      resetForm: false,
    });
    
    const { form: formData, enhance } = form;
    
    let updateStoryForm: HTMLFormElement;
    
    $: paragraphs = [];
    $: quotes = [];
    let user_id;
    let currentTab = "t1"

  const openai = new OpenAI({ apiKey: PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
  $: story = ""
  $: transcription = ""

  let technician_text = `
    Eu tenho uma transcrição de uma atendente e outro atendente que trabalha na mesma ONG. A atendente faz as seguintes perguntas:
    
    - Fale-nos de si (o seu nome, idade, o que faz no Balcão do Bairro)
    - Diga-nos porque é que contribui com o seu tempo para o Balcão do Bairro (É uma ligação pessoal? Um sentido de justiça? Já foi atendido(a) e agora está em condições de retribuir?)
    - Conte-nos uma história de uma pessoa que tenha ajudado e que nunca esquecerá
    - Diga-nos como se sentiu quando ajudou essa pessoa
    - Diga-nos como acha que trabalhar no Balcão do Bairro mudou a sua vida
    
    A partir desta  transcrição, em linguagem Português de Portugal, crie a história do atendente entrevistado de uma perspectiva externa, sem inventar dados que não estejam na transcrição e adicionando citações do atendente a ser entrevistado para dar mais visibilidade. Seguindo estes passos de como contar uma boa história:    
    - Exposição - Apresenta as personagens principais (pessoas reais!), o cenário da história (o tempo e o local relacionados com a sua organização) e o ambiente (a urgência é um bom ponto de partida)
    - Conflito - Este é o problema da sua história, o principal fator que impulsiona o enredo. O problema é frequentemente resolvido por algo que a sua organização sem fins lucrativos fez. A exposição e o conflito podem ocorrer quase simultaneamente, especialmente em textos mais curtos.
    - Ação ascendente - Todos os acontecimentos que conduzem ao clímax da sua história são considerados ação ascendente. Este é um bom local para mostrar como funciona a sua organização sem fins lucrativos e os passos que levam ao impacto que a sua equipa causa.
    - Clímax - Este é o ponto de viragem da história, o pico da ação e o ponto em que o caminho para a resolução é concretizado. Este é o nível emocional mais elevado da sua história e a parte que realmente o liga ao seu público.
    - Resolução - O fim. Não tem necessariamente de deixar o leitor com uma sensação de calor, mas deve pelo menos fazê-lo pensar e deve definitivamente deixar o seu público com uma ligação entre as suas emoções e a sua organização sem fins lucrativos.
    O texto deve ter 5 parágrafos.

    Além disso, em uma secção chamada Quotes Importantes, crie 2 quotes que sejam muito importantes, que dão mais visibilidade ao que é feito no Balcão, a forma como os fazem sentir e como os ajudam.


    O formato deverá ser:
    # História:
    <história criada>
    # Quotes importantes:
    <quotes importantes criados>
    `;

    let community_text = `
    Eu tenho uma transcrição de uma atendente de uma ONG e um cliente. A atendente faz as seguintes perguntas:
    
    - Fale-nos de si (o seu nome, idade, bairro onde vive)
    - Fale-nos de um problema que o Balcão o ajudou a resolver e das consequências desse problema
    - Diga-nos como o Balcão o ajudou a resolver o problema, especificando ao máximo os passos e todas as barreiras que enfrentou
    - Diz-nos como te sentiste quando o Balcão te ajudou, qual foi o impacto na tua vida?
    - Como resolverias isso se o Balcão não existisse? Seria mais fácil ou mais difícil?
    
    A partir desta  transcrição, em linguagem Português de Portugal, crie a história do atendente entrevistado de uma perspectiva externa, sem inventar dados que não estejam na transcrição e adicionando citações do cliente para dar mais visibilidade. Seguindo estes passos de como contar uma boa história:    
    - Exposição - Apresenta as personagens principais (pessoas reais!), o cenário da história (o tempo e o local relacionados com a sua organização) e o ambiente (a urgência é um bom ponto de partida)
    - Conflito - Este é o problema da sua história, o principal fator que impulsiona o enredo. O problema é frequentemente resolvido por algo que a sua organização sem fins lucrativos fez. A exposição e o conflito podem ocorrer quase simultaneamente, especialmente em textos mais curtos.
    - Ação ascendente - Todos os acontecimentos que conduzem ao clímax da sua história são considerados ação ascendente. Este é um bom local para mostrar como funciona a sua organização sem fins lucrativos e os passos que levam ao impacto que a sua equipa causa.
    - Clímax - Este é o ponto de viragem da história, o pico da ação e o ponto em que o caminho para a resolução é concretizado. Este é o nível emocional mais elevado da sua história e a parte que realmente o liga ao seu público.
    - Resolução - O fim. Não tem necessariamente de deixar o leitor com uma sensação de calor, mas deve pelo menos fazê-lo pensar e deve definitivamente deixar o seu público com uma ligação entre as suas emoções e a sua organização sem fins lucrativos.
    O texto deve ter 5 parágrafos.

    Além disso, em uma secção chamada Quotes Importantes, crie 2 quotes que sejam muito importantes, que dão mais visibilidade ao que é feito no Balcão, a forma como os fazem sentir e como os ajudam.
    
    O formato deverá ser:
    # História:
    <história criada>
    # Quotes importantes:
    <quotes importantes criados>
    `;
  
  $: submittingSave = false;
  $: submittingPublish = false;
  let apiImage: CarouselAPI;
  let apiQuote: CarouselAPI;
  let currentFirstImage = 0;
  let currentQuote = 0;
  let selectedImage = '';
  let selectedQuote = '';

  let imageOptions = [
    { src: $formData.image[0], alt: 'First Image' },
    { src: $formData.image[1], alt: 'Second Image' }
  ];

  $: if (apiImage) {;
    selectedImage= imageOptions[currentFirstImage].src;
    apiImage.on("select", () => {
      currentFirstImage = currentFirstImage === 0 ? 1 : 0;
      selectedImage = imageOptions[currentFirstImage].src;
    });
  }
  
  $: if (apiQuote) {
    selectedQuote = quotes[currentQuote];
    apiQuote.on("select", () => {
      currentQuote = currentQuote === 0 ? 1 : 0;
      console.log(currentQuote)
      selectedQuote = quotes[currentQuote];
    });
  }

async function organizeText(text) {
  let paragraphsText = [];
  let quotesText = [];

  // Separate the story from the quotes
  let parts = text.split("# Quotes importantes:");

  // Split the story into paragraphs and trim any extra whitespace
  if (parts[0]) {
    paragraphsText = parts[0]
      .replace("# História:", "")
      .trim()
      .split("\n\n");
  }

  // Extract quotes from the second part, if it exists
  if (parts[1]) {
    quotesText = parts[1]
      .trim()
      .split("\n")
      .map(line => line.replace(/^\d+\.\s*/, "").replace(/^"|"$/g, "").trim());
  }
  return [paragraphsText, quotesText]
}

async function transcribe(audioFile) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text"
    });

    return transcription;

  } catch (error) {
    console.log("error in transcription", error)
    return null;
  }
}

async function generate_story(role, transcription:string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          "role": "system",
          "content": role === "technician" ? `${technician_text}` : `${community_text}`
        },
        {
          "role": "user",
          "content": transcription
        }
      ],
      temperature: 1,
      max_tokens: 1600,
      top_p: 1,
    });

    console.log(response)

    return response;

  } catch (error) {
    console.log("error in generating story", error)
    return null;
  }
}

const getIdentifier = (url: string) => {
  const regex = /\/([^/]+)\.(mov|mp3|mp4|3gp|avi|mkv|flv|wmv|wav|ogg)$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getExtension = (url:string) => {
  const match = url.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  return match ? match[1] : null;
};

const getBlobFromUrl = async (url:string) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') });
  return blob;
};


onMount(async () => {
  const formData = $formData;
  user_id = formData.user_id;

  const transcribeRecording = async (recordingLink: string) => {
      const extension = getExtension(recordingLink);
      let videoUrl = recordingLink;

      if (extension !== "mp4") {
          const identifier = getIdentifier(recordingLink);
          videoUrl = `https://res.cloudinary.com/${PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4/${identifier}.mp4`;
      }

      try {
          const blob = await getBlobFromUrl(videoUrl);
          const videoFile = new File([blob], 'audio_file.mp4', { type: 'video/mp4' });

          console.log("Transcribing...");
          return await transcribe(videoFile);
      } catch (error) {
          console.error("Error during transcription:", error);
          throw error;
      }
  };

  if (!formData.transcription) {
      try {
          const transcriptionResult = await transcribeRecording(formData.recording_link);
          transcription = transcriptionResult;
          story = await generate_story(formData.role, transcription);
          organizeText(formData.storyteller, story);
      } catch (error) {
          console.error("Failed to transcribe recording:", error);
      }
  } else {
    if (formData.pub_story_text) {
      paragraphs = formData.pub_story_text;
      quotes = formData.pub_quotes;
    } else {
      let storyResult = await generate_story(formData.role, formData.transcription);
      let [paragraphsResult, quotesResult] = await organizeText(storyResult.choices[0].message.content);
      paragraphs = paragraphsResult;
      quotes = quotesResult;
    }
  }

});

	function submit(field: string) {
		return ({detail: newValue}) => {
			// IRL: POST value to server here
			console.log(`updated ${field}, new value is: "${newValue}"`)
		}
	}

  async function submitUpdateStoryForm(event) {
    if (event.submitter.value === "save") {
      submittingSave = true;
    } else {
      submittingPublish = true;
    }

    event.preventDefault();

    const newFormData = new FormData(event.currentTarget);

    if (event.submitter) {
      newFormData.append(event.submitter.name, event.submitter.value);
    }

    console.log("current quote", currentQuote)
    console.log("quotes", quotes)
    
    paragraphs.forEach(p => newFormData.append('pub_story_text', p));
    newFormData.append('pub_quotes', quotes[currentQuote])
    newFormData.append('pub_quotes', currentQuote == 0 ? quotes[1] : quotes[0])
    newFormData.append('pub_selected_images', selectedImage);
    newFormData.append('pub_selected_images', currentFirstImage == 0 ? imageOptions[1].src : imageOptions[0].src);
    newFormData.append('id', $formData.id);
    newFormData.append('template', currentTab);

    const response = await fetch('?/updateStory', {
      method: 'POST',
      body: newFormData,
      headers: {
        'x-sveltekit-action': 'true'
      }
    });

		const result =  deserialize(await response.text());
    if (result.type === "success") {
      if (event.submitter.value === "save") {
        submittingSave = false;
      } else {
        submittingPublish = false;
      }
    }

		applyAction(result);
	}
</script>


<PageHeader title={"Pré-visualização"} subtitle="" />
<form method="POST" bind:this={updateStoryForm} on:submit|preventDefault={submitUpdateStoryForm}>
<div class="container mx-auto space-y-10 pb-10">
  {#if paragraphs.length === 0}
			<PencilLine class="h-32 w-32 mx-auto" />
      <h2 class="mb-2 text-2xl font-medium text-center">A gerar a história...</h2>
      <p class="text-center">Por favor, não recarregue a página.</p>
  {:else}
  <Tabs.Root bind:value={currentTab}>
    <Tabs.List class="grid w-full grid-cols-3">
      <Tabs.Trigger value="t1">Modelo 1</Tabs.Trigger>
      <Tabs.Trigger value="t2">Modelo 2</Tabs.Trigger>
      <Tabs.Trigger value="t3">Modelo 3</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="t1">
      <Card.Root>
        <Card.Header>
          <Card.Title>Pré-visualização do Modelo 1</Card.Title>
          <Card.Description>
            Isto é uma pré-visualização. A sua história aparecerá neste formato quando a publicar.
            Pode editá-la clicando no texto. Arraste as imagens e os quotes para o lado para escolher o que mostrar.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-2">
          <div class="w-auto auto lg:float-left md:float-left  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
            <Carousel.Root bind:api={apiImage}>
              <Carousel.Content>
                {#each imageOptions as image, i (i)}
                  <Carousel.Item>
                    <div class="p-1">
                      <Card.Root>
                        <Card.Content class="flex aspect-square items-center justify-center p-6">
                          <img src={image.src} alt={image.alt} class="w-60 h-70 object-cover rounded-lg" />
                        </Card.Content>
                      </Card.Root>
                    </div>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
            </Carousel.Root>
          </div>
        
          {#each paragraphs as p}
          <p class="text-justify">
            <InPlaceEdit bind:value={p} on:submit={submit('text')}/>	
          </p>
          {/each}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
    <Tabs.Content value="t2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Pré-visualização do Modelo 2</Card.Title>
          <Card.Description>
            Isto é uma pré-visualização. A sua história aparecerá neste formato quando a publicar. 
            Pode editá-la clicando no texto. Arraste as imagens e os quotes para o lado para escolher o que mostrar.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-2">
          <div class="w-full lg:float-left md:float-left  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
            <Carousel.Root bind:api={apiImage}>
              <Carousel.Content>
                {#each imageOptions as image, i (i)}
                  <Carousel.Item>
                    <div class="p-1">
                      <Card.Root>
                        <Card.Content class="flex aspect-square items-center justify-center p-6">
                          <img src={image.src} alt={image.alt} class="w-full h-auto object-cover rounded-lg" />
                        </Card.Content>
                      </Card.Root>
                    </div>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
            </Carousel.Root>
          </div>

          <div class="w-2/3 flex justify-right mt-6">
            <Carousel.Root bind:api={apiQuote}>
              <Carousel.Content>
              {#each quotes as quote, i (i)}
                <Carousel.Item>
                  <blockquote class="p-2 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800 text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">
                    <InPlaceEdit bind:value={quote} on:submit={submit('text')}/>	
                  </blockquote>
                </Carousel.Item>
              {/each}
            </Carousel.Content>
            </Carousel.Root>
          </div>

          <div class="pt-4">
            {#each paragraphs as element, i (element)}
              <p class="text-justify pt-2">
                <InPlaceEdit bind:value={element} on:submit={submit('text')}/>	
              </p>
            {/each}
          </div>
        </Card.Content>
        
      </Card.Root>
    </Tabs.Content>
    <Tabs.Content value="t3">
      <Card.Root>
        <Card.Header>
          <Card.Title>Pré-visualização do Modelo 3</Card.Title>
          <Card.Description>
            Isto é uma pré-visualização. A sua história aparecerá neste formato quando a publicar. 
            Pode editá-la clicando no texto. Arraste as imagens e os quotes para o lado para escolher o que mostrar.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-2">
          <div class="w-full lg:float-left md:float-left  sm:max-w-sm md:max-w-md lg:max-w-xs lg:mr-4 mb-4 lg:mb-0 flex-shrink-0">
            <Carousel.Root bind:api={apiImage}>
              <Carousel.Content>
                {#each imageOptions as image, i (i)}
                  <Carousel.Item>
                    <div class="p-1">
                      <Card.Root>
                        <Card.Content class="flex aspect-square items-center justify-center p-6">
                          <img src={image.src} alt={image.alt} class="w-full h-auto object-cover rounded-lg" />
                        </Card.Content>
                      </Card.Root>
                    </div>
                  </Carousel.Item>
                {/each}
              </Carousel.Content>
            </Carousel.Root>
          </div>

        {#each paragraphs as element, i (element)}
          <p class="text-justify">
            <InPlaceEdit bind:value={element} on:submit={submit('text')}/>	
          </p>
          {#if i === (paragraphs.length - 3)}
            <div class="w-full lg:w-full mt-6">
              <Carousel.Root bind:api={apiQuote}>
                <Carousel.Content>
                  {#each quotes as quote, i (i)}
                    <Carousel.Item>
                      <blockquote class="p-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800 text-xl italic font-medium leading-relaxed text-gray-900 dark:text-white">
                        <InPlaceEdit bind:value={quote} on:submit={submit('text')}/>	
                      </blockquote>
                    </Carousel.Item>
                  {/each}
                </Carousel.Content>
              </Carousel.Root>
            </div>
          {/if}
        {/each}
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>
  {/if}
  <div class="sticky bottom-0 flex w-full flex-col sm:flex-row items-center justify-center gap-y-4 sm:gap-x-10 border-t bg-background/95 py-4 sm:py-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    {#if paragraphs.length !== 0}
      <Button variant="outline" type="submit" disabled={submittingSave} name="action" value="save" class="w-full sm:w-auto">
        {#if submittingSave}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        {/if}
        Guardar
      </Button>
      {#if user_id === user}
        <Button type="submit" name="action" disabled={submittingPublish} value="publish" class="w-full sm:w-auto">
          {#if submittingPublish}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Publicar
        </Button>
      {/if}
    {/if}
  </div>
</div>
</form>