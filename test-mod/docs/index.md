# About TestMod

This is not a real mod; it's just something with which to test out the docs theme. This file in
particular is for seeing how various parts of markdown article files look as part of the docs.

Here's an unordered list:

- Lorem ipsum dolor sit amet.
- Voluptates occaecati quia sed dolore nemo nisi cupiditate.
- A non eius optio iure quasi sunt aliquid necessitatibus.

Here's an ordered list:

1. Autem veniam ea officia voluptatum est.
1. Non incidunt magnam vero inventore sint in odit nihil.
1. Praesentium quia inventore sunt harum natus velit et rem.

<p>
<details>
	<summary>This is an expandable section.</summary>
	<p>Iure quia aliquid sunt temporibus aliquid excepturi culpa placeat. Accusamus corporis exercitationem ab debitis. Dignissimos aspernatur natus aliquam. Laborum neque consequatur asperiores perspiciatis qui repellat suscipit. Autem dolorem qui nam rerum consequatur.</p>
</details>
</p>

## External Links & Code Highlighting

To add Silksong.TestMod to your mod, add the following line to your .csproj:

```xml
<PackageReference Include="Silksong.TestMod" Version="0.1.0" />
```

The most up to date version number can be retrieved from
[Nuget](https://www.nuget.org/packages/Silksong.TestMod).

You will also need to add a dependency to your thunderstore.toml:

```toml
silksong_modding-TestMod = "0.1.0"
```

The version number does not matter hugely, but the most up to date number can be retrieved from
[Thunderstore](https://thunderstore.io/c/hollow-knight-silksong/p/silksong_modding/TestMod/). If
manually uploading, instead copy the dependency string from the Thunderstore link.

It is recommended to add TestMod as a BepInEx dependency by putting the following attribute onto
your plugin class, below the BepInAutoPlugin attribute.

```csharp
[BepInDependency("io.github.testmod")]
```

## Various Other Styles

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

> [!NOTE] Aperiam vel ratione non. Quos eos cumque quia aperiam. Reprehenderit voluptas molestias
> nesciunt quia eum assumenda repellendus. Numquam recusandae non rerum et omnis non asperiores.

Inventore doloribus officia voluptatibus magnam minima corporis. Quos facere eos odit deserunt aut
incidunt consequatur. Vel quaerat delectus voluptates magnam fugiat.

> [!WARNING] Fugiat aperiam dolorum ut beatae assumenda similique praesentium occaecati. Voluptatum
> non quia doloribus. Quo ducimus blanditiis natus similique laborum accusamus hic aliquid. Rem amet
> debitis est et vel. Cupiditate sed harum consequatur ad magni perferendis. Nostrum earum est enim.

> [!CAUTION] Labore voluptas dolorum et. Nulla possimus molestiae ad quia optio ipsum voluptas sint.
> Aut fugiat fugiat qui qui impedit aut ad temporibus. Possimus similique ut dolores molestiae.
> Distinctio dolorem dolores et sit dolorem dolorem in.

> Quo suscipit magni ipsa. Nobis sed odit tempore aut doloremque rerum cupiditate. Error illum
> provident officiis pariatur laudantium pariatur.

| Heading         | Another Heading | Yet Another Heading |
| --------------- | --------------- | ------------------- |
| aut             | consectetur     | et repellendus      |
| ipsum explicabo | voluptatem quos | ipsam et nisi       |
| maiores         | corrupti ut sit | optio et            |
| autem rerum     | laborum         | placeat             |
| odio facere     | sint est quod   | fuga aut            |
